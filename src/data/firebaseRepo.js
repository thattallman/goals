import { subDays } from 'date-fns'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset as fbConfirmPasswordReset,
  updatePassword as fbUpdatePassword,
  deleteUser,
  onAuthStateChanged,
  setPersistence,
  sendEmailVerification,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  runTransaction,
  writeBatch,
} from 'firebase/firestore'
import { auth, db, setRememberMe, rememberPersistence } from '../lib/firebase'
import { dateKey, todayKey } from '../lib/format'
import { xpForCompletion } from '../lib/gamification'

/**
 * Firebase repository — the production data path.
 *
 * Implements the same contract as mockRepo (see src/data/index.js for the full list of
 * methods). Firestore Security Rules (see firestore.rules) enforce "you can only write
 * your own rows, and read your own rows plus your partner's" — the queries here assume
 * that and never filter for safety alone.
 *
 * Field names are kept snake_case (user_id, couple_id, created_at, ...) to exactly match
 * what mockRepo already returns, since every hook/page reads these fields directly with
 * no normalization layer in between.
 */

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const generateInviteCode = () => {
  let code = ''
  for (let i = 0; i < 6; i += 1) {
    code += INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)]
  }
  return code
}

const toSession = (user) => (user ? { user: { id: user.uid, email: user.email } } : null)

export const firebaseRepo = {
  mode: 'firebase',

  /* ------------------------------------------------------------------ auth */

  async getSession() {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe()
        resolve(toSession(user))
      })
    })
  },

  onAuthStateChange(cb) {
    return onAuthStateChanged(auth, (user) => cb(toSession(user)))
  },

  async signUp({ name, email, password }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, 'profiles', cred.user.uid), {
      name,
      email,
      avatar_url: null,
      xp: 0,
      couple_id: null,
      created_at: new Date().toISOString(),
    })
    // Best-effort — the app never gates on verification, so a failure here isn't fatal.
    sendEmailVerification(cred.user).catch(() => {})
    return toSession(cred.user)
  },

  async signIn({ email, password, remember = true }) {
    setRememberMe(remember)
    await setPersistence(auth, rememberPersistence())
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return toSession(cred.user)
  },

  async signOut() {
    await fbSignOut(auth)
  },

  /** Sends the emailed link; the actual reset happens via confirmPasswordReset below. */
  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/reset-password`,
      handleCodeInApp: true,
    })
  },

  /** Redeems the oobCode from the emailed reset link. No session results from this. */
  async confirmPasswordReset(oobCode, password) {
    await fbConfirmPasswordReset(auth, oobCode, password)
  },

  /** Changing password while already signed in — different flow from the reset link. */
  async updatePassword(password) {
    await fbUpdatePassword(auth.currentUser, password)
  },

  async deleteAccount() {
    const user = auth.currentUser
    if (!user) return
    const uid = user.uid

    const profileRef = doc(db, 'profiles', uid)
    const profileSnap = await getDoc(profileRef)
    const coupleId = profileSnap.data()?.couple_id

    const goalsSnap = await getDocs(query(collection(db, 'goals'), where('user_id', '==', uid)))
    const progressSnap = await getDocs(
      query(collection(db, 'goalProgress'), where('user_id', '==', uid)),
    )

    const batch = writeBatch(db)
    for (const d of goalsSnap.docs) batch.delete(d.ref)
    for (const d of progressSnap.docs) batch.delete(d.ref)
    if (coupleId) batch.delete(doc(db, 'couples', coupleId, 'members', uid))
    batch.delete(profileRef)
    await batch.commit()

    await deleteUser(user)
  },

  /* --------------------------------------------------------------- profile */

  async getProfile(userId) {
    const snap = await getDoc(doc(db, 'profiles', userId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  },

  async updateProfile(userId, patch) {
    const ref = doc(db, 'profiles', userId)
    await updateDoc(ref, patch)
    const snap = await getDoc(ref)
    return { id: snap.id, ...snap.data() }
  },

  /* ---------------------------------------------------------------- couple */

  async getCoupleState(userId) {
    const profileSnap = await getDoc(doc(db, 'profiles', userId))
    const coupleId = profileSnap.data()?.couple_id
    if (!coupleId) return { couple: null, partner: null, members: [] }

    const coupleSnap = await getDoc(doc(db, 'couples', coupleId))
    const couple = { id: coupleSnap.id, ...coupleSnap.data() }

    const memberProfilesSnap = await getDocs(
      query(collection(db, 'profiles'), where('couple_id', '==', coupleId)),
    )
    const members = memberProfilesSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

    return {
      couple,
      members,
      partner: members.find((p) => p.id !== userId) ?? null,
    }
  },

  async createCouple(userId) {
    // Client-generated, so check-and-retry guards against the rare collision.
    let code
    let existing
    do {
      code = generateInviteCode()
      // eslint-disable-next-line no-await-in-loop
      existing = await getDocs(query(collection(db, 'couples'), where('invite_code', '==', code)))
    } while (!existing.empty)

    const coupleRef = doc(collection(db, 'couples'))
    const couple = {
      invite_code: code,
      created_by: userId,
      relationship_since: null,
      created_at: new Date().toISOString(),
    }
    await setDoc(coupleRef, couple)
    await setDoc(doc(db, 'couples', coupleRef.id, 'members', userId), {
      joined_at: new Date().toISOString(),
    })
    await setDoc(doc(db, 'profiles', userId), { couple_id: coupleRef.id }, { merge: true })

    return { id: coupleRef.id, ...couple }
  },

  async joinCouple(userId, code) {
    const normalized = code.trim().toUpperCase()
    const matchSnap = await getDocs(
      query(collection(db, 'couples'), where('invite_code', '==', normalized)),
    )
    if (matchSnap.empty) {
      throw new Error("We couldn't find that code. Double-check it with your partner?")
    }
    const coupleDoc = matchSnap.docs[0]
    const coupleId = coupleDoc.id

    const membersSnap = await getDocs(collection(db, 'couples', coupleId, 'members'))
    if (membersSnap.docs.some((d) => d.id === userId)) {
      return { id: coupleId, ...coupleDoc.data() }
    }
    if (membersSnap.size >= 2) {
      throw new Error('That couple is already complete — only two people allowed 💜')
    }

    await setDoc(doc(db, 'couples', coupleId, 'members', userId), {
      joined_at: new Date().toISOString(),
    })
    await setDoc(doc(db, 'profiles', userId), { couple_id: coupleId }, { merge: true })

    return { id: coupleId, ...coupleDoc.data() }
  },

  async leaveCouple(userId) {
    const profileSnap = await getDoc(doc(db, 'profiles', userId))
    const coupleId = profileSnap.data()?.couple_id
    if (!coupleId) return

    await deleteDoc(doc(db, 'couples', coupleId, 'members', userId))
    await setDoc(doc(db, 'profiles', userId), { couple_id: null }, { merge: true })
  },

  async updateCouple(coupleId, patch) {
    const ref = doc(db, 'couples', coupleId)
    await updateDoc(ref, patch)
    const snap = await getDoc(ref)
    return { id: snap.id, ...snap.data() }
  },

  /* ----------------------------------------------------------------- goals */

  async listGoals(userId) {
    // Single equality filter only — sorting happens client-side so no composite index
    // (user_id + created_at) is required in Firestore.
    const snap = await getDocs(query(collection(db, 'goals'), where('user_id', '==', userId)))
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  async listCoupleGoals(coupleId) {
    const snap = await getDocs(query(collection(db, 'goals'), where('couple_id', '==', coupleId)))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  },

  async createGoal(goal) {
    const row = {
      current: 0,
      description: '',
      notes: '',
      deadline: null,
      priority: 'medium',
      difficulty: 'medium',
      status: 'pending',
      archived: false,
      created_at: new Date().toISOString(),
      ...goal,
    }
    const ref = await addDoc(collection(db, 'goals'), row)
    return { id: ref.id, ...row }
  },

  async updateGoal(goalId, patch) {
    const ref = doc(db, 'goals', goalId)
    await updateDoc(ref, patch)
    const snap = await getDoc(ref)
    return { id: snap.id, ...snap.data() }
  },

  async deleteGoal(goalId) {
    const progressSnap = await getDocs(
      query(collection(db, 'goalProgress'), where('goal_id', '==', goalId)),
    )
    const batch = writeBatch(db)
    for (const d of progressSnap.docs) batch.delete(d.ref)
    batch.delete(doc(db, 'goals', goalId))
    await batch.commit()
  },

  /**
   * Single write path for progress. Mirrors the previous Supabase backend's log_progress
   * function: the counter, the progress row, the XP award and the activity feed all move
   * together in one Firestore transaction, so a client that dies halfway through can
   * never leave XP granted but the
   * counter unmoved. Firestore transactions require every read before any write, so the
   * profile read (needed only on completion) happens up front, not inside the branch that
   * uses it.
   */
  async setGoalValue({ goalId, date = todayKey(), value }) {
    const goalRef = doc(db, 'goals', goalId)
    const progressRef = doc(db, 'goalProgress', `${goalId}_${date}`)
    let updatedGoal

    await runTransaction(db, async (tx) => {
      const goalSnap = await tx.get(goalRef)
      if (!goalSnap.exists()) throw new Error('Goal not found')
      const goal = goalSnap.data()

      const progressSnap = await tx.get(progressRef)

      const wasDone = goal.current >= goal.target
      const clamped = Math.max(0, value)
      const nowDone = clamped >= goal.target
      const justCompleted = nowDone && !wasDone

      const profileRef = doc(db, 'profiles', goal.user_id)
      const profileSnap = justCompleted ? await tx.get(profileRef) : null

      // ---- writes only below this line ----

      // Career goals accumulate, so their daily row records *today's* activity rather
      // than the running total.
      const rowValue =
        goal.module === 'career'
          ? (progressSnap.exists() ? progressSnap.data().value : 0) + 1
          : clamped

      const patch = { current: clamped }
      if (goal.module === 'career') {
        patch.status =
          clamped >= goal.target ? 'completed' : clamped > 0 ? 'in_progress' : 'pending'
      }

      tx.set(progressRef, { goal_id: goalId, user_id: goal.user_id, date, value: rowValue })
      tx.update(goalRef, patch)

      // XP is awarded once, on the transition into "done".
      if (justCompleted) {
        const xp = xpForCompletion(goal)
        tx.update(profileRef, { xp: (profileSnap.data()?.xp ?? 0) + xp })

        if (goal.couple_id) {
          const activityRef = doc(collection(db, 'activityFeed'))
          tx.set(activityRef, {
            couple_id: goal.couple_id,
            user_id: goal.user_id,
            type: 'goal_completed',
            message: `${profileSnap.data()?.name ?? 'Someone'} completed ${goal.title}`,
            created_at: new Date().toISOString(),
          })
        }
      }

      updatedGoal = { id: goalId, ...goal, ...patch }
    })

    return updatedGoal
  },

  /* -------------------------------------------------------------- progress */

  async listProgress(userId, days = 365) {
    const from = dateKey(subDays(new Date(), days))
    // Single equality filter only — the date window and ascending order are applied
    // client-side so no composite index (user_id + date) is required in Firestore.
    const snap = await getDocs(
      query(collection(db, 'goalProgress'), where('user_id', '==', userId)),
    )
    return snap.docs
      .map((d) => d.data())
      .filter((r) => r.date >= from)
      .sort((a, b) => a.date.localeCompare(b.date))
  },

  /* -------------------------------------------------------------- activity */

  async listActivity(coupleId, limitCount = 12) {
    // Single equality filter only — newest-first ordering and the limit are applied
    // client-side so no composite index (couple_id + created_at) is required.
    const snap = await getDocs(
      query(collection(db, 'activityFeed'), where('couple_id', '==', coupleId)),
    )
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limitCount)
  },

  /* -------------------------------------------------------------- realtime */

  /**
   * One set of listeners for the whole couple. Any insert/update/delete on the shared
   * collections pings `onChange`, which invalidates the React Query cache — so when Riya
   * ticks off a workout, Rachit's rings move without a refresh. goalProgress doesn't need
   * its own listener: every write to it happens alongside a goals.current write in the
   * same transaction, so the goals listener already catches it.
   */
  subscribeToCouple(coupleId, onChange) {
    const unsubs = [
      onSnapshot(query(collection(db, 'goals'), where('couple_id', '==', coupleId)), onChange),
      onSnapshot(
        query(collection(db, 'activityFeed'), where('couple_id', '==', coupleId)),
        onChange,
      ),
      onSnapshot(query(collection(db, 'profiles'), where('couple_id', '==', coupleId)), onChange),
      onSnapshot(doc(db, 'couples', coupleId), onChange),
    ]
    return () => unsubs.forEach((unsub) => unsub())
  },

  /** XP is awarded inside setGoalValue's transaction; exposed only so the contract matches. */
  xpForCompletion,
}

export default firebaseRepo

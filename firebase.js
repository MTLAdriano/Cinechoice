// firebase.js — CinéChoice

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
  collection, addDoc, getDocs, deleteDoc, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCRrjPVgecVqoz7MoAhyqDSz-bWdtxJqHo",
  authDomain:        "cinechoice-134e6.firebaseapp.com",
  projectId:         "cinechoice-134e6",
  storageBucket:     "cinechoice-134e6.firebasestorage.app",
  messagingSenderId: "749960265418",
  appId:             "1:749960265418:web:5aa5bfb0bcc767890d7e33",
  measurementId:     "G-27K5P50G14"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// AUTH
export async function fbRegister(email, password, letterboxd) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "users", cred.user.uid), {
    email, letterboxd: letterboxd || "",
    platforms: [], genres: [], gfGenres: [],
    aliceGenres: [], aliceRatings: [],
    createdAt: serverTimestamp()
  });
  return cred.user;
}
export async function fbLogin(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}
export async function fbLogout() { await signOut(auth); }
export function fbOnAuth(callback) { onAuthStateChanged(auth, callback); }

// PROFIL
export async function fbGetProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}
export async function fbSaveProfile(uid, data) {
  await updateDoc(doc(db, "users", uid), data);
}

// FILMS (vus)
export async function fbGetFilms(uid) {
  const q = query(collection(db, "users", uid, "films"), orderBy("addedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function fbAddFilm(uid, film) {
  const ref = await addDoc(collection(db, "users", uid, "films"), { ...film, addedAt: serverTimestamp() });
  return ref.id;
}
export async function fbDeleteFilm(uid, filmId) {
  await deleteDoc(doc(db, "users", uid, "films", filmId));
}
export async function fbBulkAddFilms(uid, films) {
  const chunks = [];
  for (let i = 0; i < films.length; i += 20) chunks.push(films.slice(i, i + 20));
  for (const chunk of chunks) {
    await Promise.all(chunk.map(f => addDoc(collection(db, "users", uid, "films"), { ...f, addedAt: serverTimestamp() })));
  }
}

// WATCHLIST (à voir)
export async function fbGetWatchlist(uid) {
  const q = query(collection(db, "users", uid, "watchlist"), orderBy("addedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function fbAddToWatchlist(uid, film) {
  const ref = await addDoc(collection(db, "users", uid, "watchlist"), { ...film, addedAt: serverTimestamp() });
  return ref.id;
}
export async function fbRemoveFromWatchlist(uid, filmId) {
  await deleteDoc(doc(db, "users", uid, "watchlist", filmId));
}

// ALICE FILMS
export async function fbGetAliceFilms(uid) {
  const q = query(collection(db, "users", uid, "aliceFilms"), orderBy("addedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
export async function fbAddAliceFilm(uid, film) {
  const ref = await addDoc(collection(db, "users", uid, "aliceFilms"), { ...film, addedAt: serverTimestamp() });
  return ref.id;
}
export async function fbDeleteAliceFilm(uid, filmId) {
  await deleteDoc(doc(db, "users", uid, "aliceFilms", filmId));
}

export { auth, db };

// firebase/auth mock
const mockFirebaseAuth = {
  getAuth: () => ({}),
  signInWithPhoneNumber: () => 
    Promise.resolve({ 
      confirmation: { 
        confirm: () => Promise.resolve({ 
          user: { getIdToken: () => Promise.resolve('test-token') } 
        }) 
      } 
    }),
  RecaptchaVerifier: class RecaptchaVerifier {},
  GoogleAuthProvider: class GoogleAuthProvider {},
  signInWithPopup: () => Promise.resolve({ 
    user: { getIdToken: () => Promise.resolve('test-token') } 
  }),
  signInWithRedirect: () => Promise.resolve(),
  getRedirectResult: () => Promise.resolve(null)
};

export default mockFirebaseAuth;
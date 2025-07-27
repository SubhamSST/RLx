import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import SignIn from "./pages/SignIn";
import Analytics from "./pages/Analytics";
import History from "./pages/History";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  return (
    <BrowserRouter>
      <ClerkProvider publishableKey={clerkPubKey}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
                    <Route path="/dashboard" element={
            <>
              <SignedIn>
                <Dashboard />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          } />
          <Route path="/analytics" element={
            <>
              <SignedIn>
                <Analytics />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          } />
          <Route path="/history" element={
            <>
              <SignedIn>
                <History />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          } />
          <Route path="/sign-in" element={<SignIn />} />
        </Routes>
      </ClerkProvider>
    </BrowserRouter>
  );
}

export default App;

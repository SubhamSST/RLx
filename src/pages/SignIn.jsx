import { SignIn } from "@clerk/clerk-react";

function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <SignIn />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form onSubmit={handleLogin} className="bg-[#1a1a1a] p-10 rounded-xl space-y-6">
        <h2 className="text-3xl font-bold text-yellow-400">Sign In</h2>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 rounded bg-gray-800 text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded bg-gray-800 text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="w-full py-3 bg-yellow-500 text-black rounded text-xl">
          Sign In
        </button>
      </form>
    </div>
  );
}

export default SignIn;

import { SignIn } from "@clerk/clerk-react";

const SignInPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-6">
    <SignIn
      routing="path"
      path="/sign-in"
      signUpUrl="/sign-up"
      redirectUrl="/"
      appearance={{
        elements: {
          card: "shadow-xl border border-border",
        },
      }}
    />
  </div>
);

export default SignInPage;
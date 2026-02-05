import { SignUp } from "@clerk/clerk-react";

const SignUpPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-background p-6">
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl="/sign-in"
      redirectUrl="/"
      appearance={{
        elements: {
          card: "shadow-xl border border-border",
        },
      }}
    />
  </div>
);

export default SignUpPage;
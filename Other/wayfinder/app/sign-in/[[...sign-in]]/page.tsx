import SignInPage from "./SignInPage";

export const metadata = {
    title: "Sign In | Wayfinder®",
    description: "Sign in to access Wayfinder® features",
    openGraph: {
        title: "Sign In | Wayfinder®",
        description: "Sign in to access Wayfinder® features",
        url: "https://wayfinder.ink/sign-in",
        siteName: "Wayfinder",
        images: [
            {
                url: "/wayfinder.png",
                width: 800,
                height: 800,
                alt: "Wayfinder Photo",
            },
        ],
        locale: "en_SG",
        type: "website",
    },
};

function SignIn() {
    return (
        <SignInPage />
    )
}

export default SignIn
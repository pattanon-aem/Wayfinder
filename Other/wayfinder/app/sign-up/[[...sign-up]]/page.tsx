import SignUpPage from "./SignUpPage";

export const metadata = {
    title: "Sign Up | Wayfinder®",
    description: "Sign up to access Wayfinder® features",
    openGraph: {
        title: "Sign Up | Wayfinder®",
        description: "Sign up to access Wayfinder® features",
        url: "https://wayfinder.ink/sign-up",
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

function SignUp() {
    return (
        <SignUpPage />
    )
}

export default SignUp
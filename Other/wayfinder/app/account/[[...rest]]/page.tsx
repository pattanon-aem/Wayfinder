import AccountPage from "./AccountPage";

export const metadata = {
    title: "Account | Wayfinder®",
    description: "Log in to your account to continue using Wayfinder®",
    openGraph: {
        title: "Account | Wayfinder®",
        description: "Log in to your account to continue using Wayfinder",
        url: "https://wayfinder.ink/account",
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

function Account() {
    return (
        <AccountPage />
    )
}

export default Account

import TaxiMapPage from "./TaxiPage";

export const metadata = {
    title: "Taxi Map | Wayfinder®",
    description: "Explore taxi routes and stands using Wayfinder®",
    openGraph: {
        title: "Taxi Map | Wayfinder®",
        description: "Explore taxi routes and stands using Wayfinder",
        url: "https://wayfinder.ink/map/taxi",
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

function TaxiMap() {
    return (
        <TaxiMapPage />
    )
}

export default TaxiMap
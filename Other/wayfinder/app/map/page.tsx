import MapPage from "./MapPage";

export const metadata = {
    title: "Map | Wayfinder®",
    description: "Explore various routes and traffic data with Wayfinder®",
    openGraph: {
        title: "Map | Wayfinder®",
        description: "Explore various routes and traffic data with Wayfinder",
        url: "https://wayfinder.ink/map",
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

function Map() {
    return (
        <MapPage />
    )
}

export default Map
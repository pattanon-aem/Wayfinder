import BusMapPage from "./BusPage";

export const metadata = {
    title: "Bus Map | Wayfinder®",
    description: "Explore bus routes and stops using Wayfinder®",
    openGraph: {
        title: "Bus Map | Wayfinder®",
        description: "Explore bus routes and stops using Wayfinder",
        url: "https://wayfinder.ink/map/bus",
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

function BusMap() {
    return (
        <BusMapPage />
    )
}

export default BusMap
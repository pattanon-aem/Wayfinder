import CarMapPage from "./CarPage";

export const metadata = {
    title: "Car Map | Wayfinder®",
    description: "Explore car routes and parking using Wayfinder®",
    openGraph: {
        title: "Car Map | Wayfinder®",
        description: "Explore car routes and parking using Wayfinder",
        url: "https://wayfinder.ink/map/car",
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

function CarMap() {
    return (
        <CarMapPage />
    )
}

export default CarMap
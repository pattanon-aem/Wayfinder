import Link from "next/link"
import { GoPlus } from "react-icons/go"

function Card({ title = "Card Title", link = "/" }: { title?: string, link?: string }) {
    return (
        <Link href={link} className='flex rounded-xl items-end justify-between bg-gradient-to-b p-8 from-[#141414] to-[#0C0C0C] h-full'>
            <h3>
                {title}
            </h3>
            <div className="rounded-full bg-[#212121] flex p-2">
                <GoPlus className="text-[#7D7D7D]" />
            </div>
        </Link>
    )
}

export default Card
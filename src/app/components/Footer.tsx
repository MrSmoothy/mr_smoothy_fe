import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#4A2C1B] w-full mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#F5EFE6] mb-4">MR.SMOOTHY</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="text-[#F5EFE6] font-semibold mb-4 uppercase text-sm">SHOP</h3>
            <div className="flex flex-col gap-2">
              <Link href="#" className="text-[#F5EFE6]/80 hover:text-[#F5EFE6] transition-colors text-sm">
                DELIVERY
              </Link>
              <Link href="#" className="text-[#F5EFE6]/80 hover:text-[#F5EFE6] transition-colors text-sm">
                PICKUP
              </Link>
            </div>
          </div>
          <div>
            <h3 className="text-[#F5EFE6] font-semibold mb-4 uppercase text-sm">COMPANY</h3>
            <div className="flex flex-col gap-2">
              <Link href="#" className="text-[#F5EFE6]/80 hover:text-[#F5EFE6] transition-colors text-sm">
                LOCATION
              </Link>
            </div>
          </div>
          <div>
            <h3 className="text-[#F5EFE6] font-semibold mb-4 uppercase text-sm">CONNECT</h3>
            <div className="flex flex-col gap-2">
              <Link href="#" className="text-[#F5EFE6]/80 hover:text-[#F5EFE6] transition-colors text-sm">
                CONTACT US
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-[#F5EFE6]/20 text-center">
          <p className="text-[#F5EFE6]/60 text-sm">© 2024 Mr. Smoothy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


"use client";

import { Phone, Mail, MapPin, Clock, Facebook, Instagram, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function ContactPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ข้อมูลร้าน
  const shopInfo = {
    name: "Mr. Smoothy",
    phone: "0-4422-3000",
    email: "contact@mrsmoothy.com",
    address: "111 ถนนมหาวิทยาลัย ตำบลสุรนารี อำเภอเมือง จังหวัดนครราชสีมา 30000",
    fullAddress: "มหาวิทยาลัยเทคโนโลยีสุรนารี (SUT) 111 ถนนมหาวิทยาลัย ตำบลสุรนารี อำเภอเมือง จังหวัดนครราชสีมา 30000",
    openingHours: {
      weekdays: "09:00 - 20:00",
      weekends: "10:00 - 22:00"
    },
    location: {
      lat: 14.8719,
      lng: 102.0234
    }
  };

  // Partner logos
  const partners = [
    { name: "มหาวิทยาลัยเทคโนโลยีสุรนารี", logo: "/sut.png" },
    { name: "SUT Institute of Digital Arts and Science", logo: "/DGT.jpeg" },
    { name: "SUT Computer Science", logo: "/comscience.jpeg" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF6F0] to-white">
      {/* Hero Section */}
      <div className="bg-[#14433B] text-white py-8 sm:py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-serif mb-3 sm:mb-4 text-center">ติดต่อเรา</h1>
          <p className="text-base sm:text-lg md:text-xl text-center text-[#FFF6F0]/90 font-sans px-4">เรายินดีให้บริการและตอบคำถามของคุณ</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* ข้อมูลติดต่อ */}
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-[#14433B] mb-6 font-serif">ข้อมูลติดต่อ</h2>
            
            <div className="space-y-6">
              {/* เบอร์โทรศัพท์ */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FFF6F0] flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-[#14433B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#14433B] mb-1 font-sans">เบอร์โทรศัพท์</h3>
                  <a href={`tel:${shopInfo.phone}`} className="text-[#14433B]/70 hover:text-[#14433B] transition-colors font-sans">
                    {shopInfo.phone}
                  </a>
                </div>
              </div>

              {/* อีเมล */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FFF6F0] flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-[#14433B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#14433B] mb-1 font-sans">อีเมล</h3>
                  <a href={`mailto:${shopInfo.email}`} className="text-[#14433B]/70 hover:text-[#14433B] transition-colors font-sans">
                    {shopInfo.email}
                  </a>
                </div>
              </div>

              {/* ที่ตั้ง */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FFF6F0] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-[#14433B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#14433B] mb-1 font-sans">ที่ตั้งร้าน</h3>
                  <p className="text-[#14433B]/70 font-sans mb-1">{shopInfo.fullAddress}</p>
                  <p className="text-[#14433B]/70 font-sans">{shopInfo.address}</p>
                </div>
              </div>

              {/* เวลาเปิด-ปิด */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FFF6F0] flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-[#14433B]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#14433B] mb-1 font-sans">เวลาเปิด-ปิด</h3>
                  <p className="text-[#14433B]/70 font-sans">
                    จันทร์ - ศุกร์: {shopInfo.openingHours.weekdays}
                  </p>
                  <p className="text-[#14433B]/70 font-sans">
                    เสาร์ - อาทิตย์: {shopInfo.openingHours.weekends}
                  </p>
                </div>
              </div>

              {/* Social Media */}
              <div className="flex items-start gap-4 pt-4">
                <div className="w-12 h-12 rounded-full bg-[#FFF6F0] flex items-center justify-center flex-shrink-0">
                  <Facebook className="w-6 h-6 text-[#14433B]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#14433B] mb-3 font-sans">ติดตามเราบน</h3>
                  <div className="flex gap-4">
                    <a 
                      href="https://facebook.com" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                      aria-label="Facebook"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                    <a 
                      href="https://instagram.com" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-[#E1306C] to-[#F77737] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                      aria-label="Instagram"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                    <a 
                      href="https://line.me" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-[#00C300] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                      aria-label="Line"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* แผนที่ */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <h2 className="text-2xl font-bold text-[#14433B] p-8 pb-4 font-serif">แผนที่</h2>
            {isClient && (
              <div className="h-[400px] w-full relative">
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(shopInfo.fullAddress)}&output=embed&z=15`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                  title="แผนที่ร้าน Mr. Smoothy"
                />
              </div>
            )}
            <div className="p-4 bg-[#FFF6F0]">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shopInfo.fullAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#14433B] hover:text-[#14433B]/70 font-sans text-center block underline transition-colors"
              >
                เปิดใน Google Maps →
              </a>
            </div>
          </div>
        </div>

        {/* Partner Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-[#14433B] mb-6 text-center font-serif">Partner</h2>
          <p className="text-[#14433B]/70 text-center mb-8 font-sans">
            เราภูมิใจที่ได้ร่วมมือกับพันธมิตรชั้นนำในการสร้างสรรค์ผลิตภัณฑ์คุณภาพ
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {partners.map((partner, index) => (
              <div 
                key={index}
                className="flex flex-col items-center justify-center p-6 bg-[#FFF6F0] rounded-lg hover:bg-[#FFF6F0] transition-colors"
              >
                <img 
                  src={partner.logo} 
                  alt={partner.name}
                  className="max-w-full max-h-32 object-contain mb-3"
                />
                <span className="text-[#14433B] font-semibold font-sans text-center text-sm">{partner.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ข้อมูลเพิ่มเติม */}
        <div className="bg-[#14433B] rounded-lg shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4 text-center font-serif">เกี่ยวกับ {shopInfo.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <h3 className="font-semibold mb-2 font-sans">พันธกิจ</h3>
              <p className="text-[#FFF6F0]/80 text-sm font-sans">
                สร้างสรรค์เครื่องดื่มเพื่อสุขภาพที่อร่อยและมีคุณภาพสำหรับทุกคน
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 font-sans">วิสัยทัศน์</h3>
              <p className="text-[#FFF6F0]/80 text-sm font-sans">
                เป็นแบรนด์สมูทตี้ชั้นนำที่ส่งเสริมการดำเนินชีวิตที่มีสุขภาพดี
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 font-sans">ค่านิยม</h3>
              <p className="text-[#FFF6F0]/80 text-sm font-sans">
                คุณภาพ ธรรมชาติ สดใหม่ และความใส่ใจในรายละเอียด
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


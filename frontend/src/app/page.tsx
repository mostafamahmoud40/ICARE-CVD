import Image from "next/image";
import Link from "next/link";
import { Lora } from "next/font/google";
import { PhoneCall, Mail, ChevronRight, Clock, ShieldCheck, Activity, Heart, Award, Calendar, Users, Microscope, Stethoscope, ChevronDown } from "lucide-react";

const lora = Lora({
  subsets: ["latin"],
  display: "swap",
});

/** Shared horizontal shell — aligned header + sections, wider than max-w-7xl */
const SHELL = "mx-auto w-full max-w-[1440px] px-6 md:px-10 lg:px-14";

const ABOUT_SECTION_IMAGE = "/healthca_about.png";

export default function Home() {
  return (
    <div className={`${lora.className} text-[#1A1F1E] antialiased bg-[#F9F8F5]`}>
      {/* Fixed floating navbar — stays on scroll */}
      <div className="fixed top-0 inset-x-0 z-50 pt-4 md:pt-6 pointer-events-none">
        <div className={`${SHELL} pointer-events-auto`}>
          <header className="w-full flex justify-between items-center gap-4 px-5 md:px-8 lg:px-10 py-3.5 rounded-full bg-[#F9F8F5]/55 backdrop-blur-md border border-[#E8E6E0]/35 shadow-sm">
            <Link href="/" className="flex items-center gap-2 text-[#1A5345] shrink-0">
              <Heart className="size-6 text-[#1A5345] fill-[#1A5345]" />
              <span className="text-xl md:text-2xl font-bold tracking-tight">Healthca</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-6 xl:gap-10 text-[#6B7870] text-sm font-medium">
              <Link href="/" className="font-bold text-[#1A5345]">Home</Link>
              <Link href="#" className="hover:text-[#1A5345] transition-colors">About Us</Link>
              <div className="flex items-center gap-1 cursor-pointer hover:text-[#1A5345] transition-colors">Services <ChevronDown className="size-4" /></div>
              <div className="flex items-center gap-1 cursor-pointer hover:text-[#1A5345] transition-colors">Pages <ChevronDown className="size-4" /></div>
              <Link href="#" className="hover:text-[#1A5345] transition-colors">Blog</Link>
              <Link href="#" className="hover:text-[#1A5345] transition-colors">Contact Us</Link>
            </nav>

            <Link href="/login" className="hidden sm:inline-flex h-8 shrink-0 items-center rounded-lg border-0 bg-[#1A5345] px-4 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-[#133F34]">
              Get Started
            </Link>
          </header>
        </div>
      </div>

      {/* ─── Hero (light — matches assistant dashboard) ─── */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E8F0EE] rounded-full blur-3xl opacity-60 -translate-y-1/3 translate-x-1/4 pointer-events-none" />

        {/* Hero Content */}
        <section className="relative pt-24 md:pt-28 pb-20 lg:pb-28 z-10">
          <div className={`${SHELL} grid lg:grid-cols-2 gap-10 lg:gap-16 xl:gap-20 items-center`}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="rounded-lg bg-[#CC5533] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                  24/7 Emergency
                </span>
                <p className="text-sm font-bold uppercase tracking-widest text-[#1A5345]">
                  Hospital & Medical Clinic
                </p>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-8 text-[#1A1F1E]">
                We Are A Full Service<br />
                Clinic With Modern<br />
                Technology
              </h1>

              <div className="flex flex-wrap items-center gap-4">
                <Link href="/login" className="rounded-lg bg-[#1A5345] text-white px-8 py-3.5 font-bold flex items-center gap-2 hover:bg-[#133F34] transition-colors shadow-sm">
                  Book Appointment <ChevronRight className="size-5" />
                </Link>

                <div className="flex items-center gap-3 rounded-xl border border-[#E8E6E0]/70 bg-white p-3 shadow-sm">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE]">
                    <PhoneCall className="size-5 text-[#CC5533]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#6B7870]">Emergency Call</p>
                    <p className="font-bold text-[#1A1F1E]">(+86) 1208 1091 86</p>
                  </div>
                </div>
              </div>

              {/* Opening Hours Card */}
              <div className="mt-10 rounded-2xl border border-[#E8E6E0]/60 bg-white p-6 md:p-8 max-w-lg shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-[#E8F0EE]">
                    <Clock className="size-4 text-[#1A5345]" />
                  </div>
                  <h3 className="font-bold text-lg text-[#1A1F1E]">Opening Hours</h3>
                </div>
                <div className="space-y-3 text-sm font-medium">
                  <div className="flex justify-between border-b border-[#E8E6E0] pb-3">
                    <span className="text-[#6B7870]">Monday - Friday</span>
                    <span className="text-[#1A5345] font-bold">8:00am - 5:00pm</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-[#6B7870]">Saturday - Sunday</span>
                    <span className="text-[#CC5533] font-bold">9:00am - 3:30pm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative flex items-center justify-center h-[380px] sm:h-[440px] lg:h-[560px] xl:h-[640px] w-full min-w-0">
              <div className="relative h-full w-[min(96%,460px)] lg:w-[min(92%,500px)]">
                <div className="absolute inset-0 bg-[#E8F0EE] rounded-full" />
                <div className="absolute inset-x-0 inset-y-1 z-10">
                  <Image
                    src="/healthca_why_nobg.png"
                    alt="Doctor"
                    fill
                    sizes="(max-width: 1024px) 96vw, 500px"
                    className="object-contain object-center scale-[1.2]"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ─── About Us Section ─── */}
      <section className="py-20 lg:py-24">
        <div className={`${SHELL} grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center`}>
          {/* Left Image Group */}
          <div className="relative">
            <div className="relative rounded-[40px] overflow-hidden aspect-square w-full max-w-xl mx-auto lg:mx-0 lg:max-w-none bg-white">
              <Image
                src={ABOUT_SECTION_IMAGE}
                alt="Doctor consulting patient"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
            
            {/* Floating Quality Healthcare Card */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 md:-left-8 md:translate-x-0 rounded-2xl border border-[#E8E6E0]/60 bg-white p-6 shadow-sm flex items-center gap-5 w-[300px]">
              <div className="size-14 rounded-xl bg-[#E8F0EE] flex items-center justify-center shrink-0">
                <Stethoscope className="size-7 text-[#1A5345]" />
              </div>
              <div>
                <h4 className="font-bold text-[#1A1F1E] text-lg mb-1">Quality Healthcare</h4>
                <p className="text-xs text-[#6B7870] leading-relaxed">Facilisis nulla lacus at ultrices us praesent fringilla scelerisque.</p>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="mt-12 lg:mt-0 min-w-0">
            <p className="text-[#1A5345] font-bold text-sm uppercase tracking-widest mb-4">ABOUT US</p>
            <h2 className="text-[#1A1F1E] text-4xl lg:text-5xl font-bold leading-[1.15] mb-6">
              Our Practice Excellent Care, Humane Principles
            </h2>
            <p className="text-[#6B7870] mb-10 leading-relaxed">
              Et phasellus turpis vel fermentum cursus. Cursus mi placerat faucibus sapien purus
              odio arcu in. Amet dui mauris accumsan elit nec. Sit egestas aenean habitant
              fringilla condimentum purus.
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm relative overflow-hidden">
                <Users className="absolute right-4 top-4 size-5 text-[#1A5345]" />
                <h3 className="text-2xl font-bold text-[#1A1F1E] mb-1">8,200<span className="text-[#4A8F7C]">+</span></h3>
                <p className="text-xs text-[#6B7870]">Patients Recovered</p>
              </div>
              <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm relative overflow-hidden">
                <Clock className="absolute right-4 top-4 size-5 text-[#CC5533]" />
                <h3 className="text-2xl font-bold text-[#1A1F1E] mb-1">8,200<span className="text-[#CC5533]">+</span></h3>
                <p className="text-xs text-[#6B7870]">Average Waiting Time</p>
              </div>
              <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-5 shadow-sm relative overflow-hidden">
                <Activity className="absolute right-4 top-4 size-5 text-[#1A5345]" />
                <h3 className="text-2xl font-bold text-[#1A1F1E] mb-1">4.9/5</h3>
                <p className="text-xs text-[#6B7870]">Satisfaction Rating</p>
              </div>
            </div>

            <Link href="#" className="inline-flex rounded-lg bg-[#1A5345] text-white px-8 py-3.5 font-bold items-center gap-2 hover:bg-[#133F34] transition-colors shadow-sm">
              Learn More <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Why Choose Us Section ─── */}
      <section className="bg-[#F9F8F5] py-20 lg:py-24">
        <div className={`${SHELL} text-center mb-12 lg:mb-16`}>
          <p className="text-[#1A5345] font-bold text-sm uppercase tracking-widest mb-4">WHY CHOOSE US</p>
          <h2 className="text-[#1A1F1E] text-4xl lg:text-5xl font-bold">
            The Health Partner You've Been Looking For
          </h2>
        </div>

        <div className={`${SHELL} grid lg:grid-cols-3 gap-10 lg:gap-12 xl:gap-16 items-center`}>
          {/* Left Features */}
          <div className="space-y-8 order-2 lg:order-1">
            <div className="flex gap-6">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE]">
                <Microscope className="size-5 text-[#1A5345]" />
              </div>
              <div>
                <h4 className="font-bold text-[#1A1F1E] text-xl mb-2">Hospital-Level Technology, Boutique Feel</h4>
                <p className="text-[#6B7870] text-sm leading-relaxed">Nec tristique sed rutrum fringilla it fringilla condimentum purus.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE]">
                <Activity className="size-5 text-[#CC5533]" />
              </div>
              <div>
                <h4 className="font-bold text-[#1A1F1E] text-xl mb-2">Rapid Results, Proven Outcomes</h4>
                <p className="text-[#6B7870] text-sm leading-relaxed">Nec tristique sed rutrum fringilla it fringilla condimentum purus.</p>
              </div>
            </div>
          </div>

          {/* Center Image */}
          <div className="relative order-1 lg:order-2 flex items-center justify-center h-[440px] lg:h-[560px] xl:h-[600px] w-full min-w-0">
            <div className="relative h-full w-[min(96%,460px)] lg:w-[min(92%,500px)]">
              <div className="absolute inset-0 bg-[#E8F0EE] rounded-full" />
              <div className="absolute inset-x-0 inset-y-1 z-10">
                <Image
                  src="/healthca_why_nobg.png"
                  alt="Doctor"
                  fill
                  sizes="(max-width: 1024px) 96vw, 500px"
                  className="object-contain object-center scale-[1.28]"
                />
              </div>
            </div>
          </div>

          {/* Right Features */}
          <div className="space-y-8 order-3">
             <div className="flex gap-6">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE]">
                <Heart className="size-5 text-[#1A5345]" />
              </div>
              <div>
                <h4 className="font-bold text-[#1A1F1E] text-xl mb-2">Compassion-Centered Culture</h4>
                <p className="text-[#6B7870] text-sm leading-relaxed">Nec tristique sed rutrum fringilla it fringilla condimentum purus.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE]">
                <ShieldCheck className="size-5 text-[#1A5345]" />
              </div>
              <div>
                <h4 className="font-bold text-[#1A1F1E] text-xl mb-2">Transparent & Affordable Healthcare</h4>
                <p className="text-[#6B7870] text-sm leading-relaxed">Nec tristique sed rutrum fringilla it fringilla condimentum purus.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Appointment Section ─── */}
      <section className="py-16 lg:py-20">
        <div className={`${SHELL} grid lg:grid-cols-2 gap-8 lg:gap-10 items-stretch`}>
          <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-8 md:p-10 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E8E6E0]/60 pb-3 mb-6">
              <p className="text-[#1A5345] font-bold text-sm uppercase tracking-widest">Appointment</p>
              <span className="rounded-lg bg-[#CC5533] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                Open Today
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-4 text-[#1A1F1E]">
              Book Your Care<br />Appointment Now
            </h2>
            <p className="text-[#6B7870] mb-8 leading-relaxed">
              Nec tristique sed rutrum fringilla it fringilla condimentum purus. Convallis nunc aliquet scelerisque mattis.
            </p>

            <div className="flex gap-4 items-center rounded-xl border border-[#E8E6E0]/70 bg-[#F9F8F5] p-4 w-full max-w-lg">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE]">
                <PhoneCall className="size-5 text-[#CC5533]" />
              </div>
              <div>
                <p className="text-xs text-[#6B7870] uppercase tracking-widest mb-1">Call</p>
                <p className="font-bold text-lg text-[#1A1F1E]">(+86) 1208 1091 86</p>
                <div className="flex gap-4 mt-1 text-xs text-[#6B7870]">
                  <span>M-F: 08:00 - 18:00</span>
                  <span>S-S: 09:00 - 16:00</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E8E6E0]/60 bg-white p-8 md:p-10 shadow-sm">
            <h3 className="text-[#1A1F1E] font-bold text-2xl mb-8">Book An Appointment</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1A1F1E]">Name*</label>
                  <input type="text" placeholder="Full Name" className="w-full bg-[#F9F8F5] border border-[#E8E6E0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5345]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1A1F1E]">Email*</label>
                  <input type="email" placeholder="Email Address" className="w-full bg-[#F9F8F5] border border-[#E8E6E0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5345]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1A1F1E]">Phone*</label>
                  <input type="tel" placeholder="Phone Number" className="w-full bg-[#F9F8F5] border border-[#E8E6E0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5345]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#1A1F1E]">Date*</label>
                  <input type="date" className="w-full bg-[#F9F8F5] border border-[#E8E6E0] rounded-xl px-4 py-3 text-sm text-[#6B7870] focus:outline-none focus:ring-2 focus:ring-[#1A5345]" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1A1F1E]">Doctor*</label>
                <select className="w-full bg-[#F9F8F5] border border-[#E8E6E0] rounded-xl px-4 py-3 text-sm text-[#6B7870] focus:outline-none focus:ring-2 focus:ring-[#1A5345] appearance-none">
                  <option>Find Doctors</option>
                  <option>Dr. Mark Harris</option>
                  <option>Dr. Sarah Jenkins</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1A1F1E]">Message</label>
                <textarea rows={4} placeholder="Your Message" className="w-full bg-[#F9F8F5] border border-[#E8E6E0] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5345] resize-none" />
              </div>

              <button type="button" className="rounded-lg bg-[#1A5345] text-white px-8 py-3.5 font-bold w-auto hover:bg-[#133F34] transition-colors flex items-center gap-2 shadow-sm">
                Send Appointments <ChevronRight className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ─── Stats Row ─── */}
      <section className="py-12 border-y border-[#E8E6E0]/60 bg-white">
        <div className={`${SHELL} grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-[#E8E6E0]/60`}>
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-[#E8F0EE]">
               <Award className="size-6 text-[#1A5345]" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#1A1F1E]">4.9K</h3>
              <p className="text-xs text-[#6B7870] font-medium">Awards Received</p>
            </div>
          </div>
           <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-[#E8F0EE]">
               <Calendar className="size-6 text-[#CC5533]" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#1A1F1E]">15<span className="text-[#CC5533]">+</span></h3>
              <p className="text-xs text-[#6B7870] font-medium">Years Of Experience</p>
            </div>
          </div>
           <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-[#E8F0EE]">
               <Stethoscope className="size-6 text-[#1A5345]" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#1A1F1E]">280<span className="text-[#4A8F7C]">+</span></h3>
              <p className="text-xs text-[#6B7870] font-medium">Doctors Specialist</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-[#E8F0EE]">
               <Users className="size-6 text-[#1A5345]" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#1A1F1E]">100%</h3>
              <p className="text-xs text-[#6B7870] font-medium">Patient Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Team Section ─── */}
      <section className="py-20 lg:py-24">
        <div className={SHELL}>
         <div className="text-center mb-12 lg:mb-16">
          <p className="text-[#1A5345] font-bold text-sm uppercase tracking-widest mb-4">DOCTOR & STAFF</p>
          <h2 className="text-[#1A1F1E] text-4xl lg:text-5xl font-bold">
            Expert Doctor & Staff Team
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {[
            { img: '/healthca_team_1.png', name: 'Dr. Mark Harris', title: 'Cardiologist' },
            { img: '/healthca_team_2.png', name: 'Dr. Sarah Jenkins', title: 'Internal Medicine' },
            { img: '/healthca_team_3.png', name: 'Dr. Robert Chen', title: 'Neurologist' },
          ].map((doc, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-[#E8E6E0]/60 bg-white shadow-sm group">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#E8E6E0]">
                <Image src={doc.img} alt={doc.name} fill className="object-cover object-top group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6 text-center bg-white">
                <h4 className="text-xl font-bold text-[#1A1F1E] mb-1">{doc.name}</h4>
                <p className="text-sm text-[#6B7870]">{doc.title}</p>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#E8E6E0]/60 bg-white pt-16 pb-10 text-[#6B7870] text-sm">
        <div className={`${SHELL} grid grid-cols-2 md:grid-cols-4 gap-12 mb-16 border-b border-[#E8E6E0]/60 pb-16`}>
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-[#1A5345] mb-6">
              <Heart className="size-6 text-[#1A5345] fill-[#1A5345]" />
              <span className="text-2xl font-bold tracking-tight">Healthca</span>
            </Link>
            <p className="mb-6 leading-relaxed max-w-xs">
              Amet dui mauris accumsan elit nec. Sit egestas aenean habitant fringilla.
            </p>
            <div className="flex gap-3">
               <div className="size-10 rounded-lg border border-[#E8E6E0]/70 bg-[#F9F8F5] flex items-center justify-center hover:bg-[#E8F0EE] cursor-pointer transition-colors text-[#1A5345]">
                  <FacebookIcon className="size-4" />
               </div>
               <div className="size-10 rounded-lg border border-[#E8E6E0]/70 bg-[#F9F8F5] flex items-center justify-center hover:bg-[#E8F0EE] cursor-pointer transition-colors text-[#1A5345]">
                  <TwitterIcon className="size-4" />
               </div>
               <div className="size-10 rounded-lg border border-[#E8E6E0]/70 bg-[#F9F8F5] flex items-center justify-center hover:bg-[#E8F0EE] cursor-pointer transition-colors text-[#1A5345]">
                  <InstagramIcon className="size-4" />
               </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-[#1A1F1E] font-bold text-lg mb-6">Our Services</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="hover:text-[#1A5345] transition-colors">Cardiology</Link></li>
              <li><Link href="#" className="hover:text-[#1A5345] transition-colors">Neurology</Link></li>
              <li><Link href="#" className="hover:text-[#1A5345] transition-colors">Orthopedics</Link></li>
              <li><Link href="#" className="hover:text-[#1A5345] transition-colors">Dental Care</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#1A1F1E] font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="hover:text-[#1A5345] transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-[#1A5345] transition-colors">Doctors</Link></li>
              <li><Link href="#" className="hover:text-[#1A5345] transition-colors">Appointment</Link></li>
              <li><Link href="#" className="hover:text-[#1A5345] transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#1A1F1E] font-bold text-lg mb-6">Support</h4>
            <ul className="space-y-4">
               <li className="flex items-center gap-3">
                  <PhoneCall className="size-4 text-[#CC5533]" /> (+86) 1208 1091 86
               </li>
               <li className="flex items-center gap-3">
                  <Mail className="size-4 text-[#1A5345]" /> Healthca@gmail.com
               </li>
            </ul>
          </div>
        </div>
        
        <div className={`${SHELL} text-center flex flex-col md:flex-row justify-between items-center gap-4`}>
          <p>© {new Date().getFullYear()} Healthca Medical. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-[#1A5345] transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-[#1A5345] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

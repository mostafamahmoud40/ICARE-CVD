"use client"

import * as React from "react"
import { useDoctorDirectory } from "./useDoctorDirectory"
import { Doctor } from "./doctorDirectory.types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  SearchIcon,
  FilterIcon,
  StarIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  ArrowRightIcon,
  HeartPulseIcon,
  BrainIcon,
  BabyIcon,
  StethoscopeIcon,
  BoneIcon,
  EyeIcon,
  VerifiedIcon,
  LanguagesIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const iconMap: Record<string, any> = {
  HeartPulse: HeartPulseIcon,
  Brain: BrainIcon,
  Baby: BabyIcon,
  Stethoscope: StethoscopeIcon,
  Bone: BoneIcon,
  Eye: EyeIcon,
}

function DoctorRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={cn(
              "size-3.5",
              i < Math.floor(rating)
                ? "fill-amber-400 text-amber-400"
                : "text-slate-200"
            )}
          />
        ))}
      </div>
      <span className="text-xs font-bold text-[#102F27] ml-1">{rating}</span>
      <span className="text-xs text-muted-foreground">({count} reviews)</span>
    </div>
  )
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  const Icon = iconMap[doctor.specialty.icon] || StethoscopeIcon

  return (
    <Card className="group overflow-hidden border-0 bg-white shadow-sm ring-1 ring-[#DDE9E4] transition-all hover:shadow-md hover:ring-[#1A5345]/30">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Image Section */}
          <div className="relative h-48 w-full shrink-0 bg-[#F8FAF9] sm:h-auto sm:w-56">
            <Avatar className="h-full w-full rounded-none">
              <AvatarImage src={doctor.imageUrl} alt={doctor.name} className="object-cover" />
              <AvatarFallback className="rounded-none bg-gradient-to-br from-[#E8F0EE] to-[#DDE9E4] text-2xl font-bold text-[#1A5345]">
                {doctor.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="absolute top-3 left-3">
              <Badge className={cn(
                "border-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                doctor.availability === "Available" 
                  ? "bg-emerald-500 text-white" 
                  : doctor.availability === "Limited" 
                    ? "bg-amber-500 text-white" 
                    : "bg-slate-400 text-white"
              )}>
                {doctor.availability}
              </Badge>
            </div>
            {doctor.rating >= 4.8 && (
              <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-1">
                  <VerifiedIcon className="size-3 text-[#1A5345]" />
                  <span className="text-[10px] font-bold text-[#1A5345]">TOP RATED</span>
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="flex flex-1 flex-col p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#102F27]">{doctor.name}</h3>
                </div>
                <p className="text-[13px] font-medium text-[#4F6D64]">{doctor.title}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1.5 rounded-lg bg-[#F0F4F2] px-2 py-1">
                    <Icon className="size-3.5 text-[#1A5345]" />
                    <span className="text-[11px] font-semibold text-[#1A5345]">{doctor.specialty.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <ClockIcon className="size-3.5" />
                    <span className="text-[11px] font-medium">{doctor.experience} years exp.</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-[#102F27]">${doctor.fee}</div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Consultation</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs text-[#4F6D64]">
                <MapPinIcon className="size-3.5 shrink-0 text-[#1A5345]" />
                <span className="truncate">{doctor.hospital} • {doctor.location}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#4F6D64]">
                <CalendarIcon className="size-3.5 shrink-0 text-[#1A5345]" />
                <span>Next Available: <span className="font-semibold text-[#102F27]">{new Date(doctor.nextAvailableSlot).toLocaleDateString("en-US", { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#4F6D64]">
                <LanguagesIcon className="size-3.5 shrink-0 text-[#1A5345]" />
                <span className="truncate">{doctor.languages.join(", ")}</span>
              </div>
            </div>

            <div className="mt-auto pt-5 flex items-center justify-between border-t border-[#E7EFEB]">
              <DoctorRating rating={doctor.rating} count={doctor.reviewCount} />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-[#1A5345] hover:bg-[#E8F0EE]">
                  View Profile
                </Button>
                <Button size="sm" className="h-8 bg-[#1A5345] px-4 text-[11px] font-bold text-white hover:bg-[#0F3D32]">
                  Book Now
                  <ArrowRightIcon className="ml-1.5 size-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DoctorDirectory() {
  const {
    doctors,
    specialties,
    searchQuery,
    setSearchQuery,
    selectedSpecialty,
    setSelectedSpecialty,
    sortBy,
    setSortBy,
  } = useDoctorDirectory()

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1A5345] p-8 text-white shadow-lg">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Find the Best Doctors</h1>
          <p className="text-lg text-emerald-50/80">
            Search across our verified network of medical professionals specialized in cardiovascular health and more.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-emerald-900/40" />
              <Input
                placeholder="Search by doctor name or specialty..."
                className="h-12 border-0 bg-white pl-10 pr-4 text-[#102F27] shadow-inner focus-visible:ring-2 focus-visible:ring-emerald-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="h-12 bg-white px-8 font-bold text-[#1A5345] hover:bg-emerald-50">
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Filters */}
        <div className="w-full shrink-0 space-y-6 lg:w-64">
          <Card className="border-0 shadow-sm ring-1 ring-[#DDE9E4]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#102F27] flex items-center gap-2">
                  <FilterIcon className="size-3.5" />
                  Filters
                </h3>
                <button 
                  onClick={() => {
                    setSelectedSpecialty(null)
                    setSearchQuery("")
                  }}
                  className="text-[11px] font-semibold text-[#1A5345] hover:underline"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Specialty</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedSpecialty(null)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-all",
                        selectedSpecialty === null
                          ? "bg-[#1A5345] text-white shadow-md"
                          : "bg-[#F0F4F2] text-[#4F6D64] hover:bg-[#E8F0EE]"
                      )}
                    >
                      All
                    </button>
                    {specialties.map((s) => {
                      const Icon = iconMap[s.icon] || StethoscopeIcon
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSpecialty(s.id)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
                            selectedSpecialty === s.id
                              ? "bg-[#1A5345] text-white shadow-md"
                              : "bg-[#F0F4F2] text-[#4F6D64] hover:bg-[#E8F0EE]"
                          )}
                        >
                          <Icon className="size-3" />
                          {s.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sort By</h4>
                  <div className="flex flex-col gap-2">
                    {[
                      { key: "rating", label: "Highest Rated" },
                      { key: "experience", label: "Most Experienced" },
                      { key: "fee", label: "Lowest Fee" },
                    ].map((option) => (
                      <button
                        key={option.key}
                        onClick={() => setSortBy(option.key as any)}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-all",
                          sortBy === option.key
                            ? "bg-[#E8F0EE] font-bold text-[#1A5345] ring-1 ring-[#1A5345]/20"
                            : "text-[#4F6D64] hover:bg-[#F8FAF9]"
                        )}
                      >
                        {option.label}
                        {sortBy === option.key && <div className="size-1.5 rounded-full bg-[#1A5345]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Support Card */}
          <div className="rounded-2xl bg-gradient-to-br from-[#E8F0EE] to-[#DDE9E4] p-5 shadow-inner">
            <h4 className="font-bold text-[#102F27]">Need Help?</h4>
            <p className="mt-1 text-xs text-[#4F6D64]">
              Our care coordinators can help you find the right specialist for your needs.
            </p>
            <Button variant="link" className="mt-2 h-auto p-0 text-xs font-bold text-[#1A5345]">
              Chat with Support
            </Button>
          </div>
        </div>

        {/* Results Section */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-bold text-[#102F27]">{doctors.length}</span> results
            </div>
          </div>

          {doctors.length > 0 ? (
            <div className="grid gap-5">
              {doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#E5EEEA] bg-white py-16 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#F5F5F3]">
                <SearchIcon className="size-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-[#102F27]">No doctors found</h3>
              <p className="max-w-xs text-sm text-muted-foreground">
                We couldn't find any doctors matching your current search or filters.
              </p>
              <Button 
                variant="outline" 
                className="mt-6 border-[#1A5345] text-[#1A5345]"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedSpecialty(null)
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

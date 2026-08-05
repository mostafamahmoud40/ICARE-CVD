"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { ExternalLinkIcon, FileIcon } from "lucide-react"
import { resolveChatAttachmentUrl } from "./chat-attachment-url"
import { collectSharedMediaFromMessages } from "./chat-shared-media"
import { formatFileSize } from "./chat-api"
import type { ChatMessage } from "./chat.types"

type SharedMediaTab = "photos" | "files" | "links"

interface SharedMediaSectionProps {
  messages: ChatMessage[]
}

export function SharedMediaSection({ messages }: SharedMediaSectionProps) {
  const t = useTranslations("chat")
  const [activeTab, setActiveTab] = useState<SharedMediaTab>("photos")
  const [previewImage, setPreviewImage] = useState<{ url: string; fileName: string } | null>(null)

  const media = useMemo(() => collectSharedMediaFromMessages(messages), [messages])
  const totalCount = media.photos.length + media.files.length + media.links.length

  const tabs: { key: SharedMediaTab; label: string; count: number }[] = [
    { key: "photos", label: t("sharedMedia.photos"), count: media.photos.length },
    { key: "files", label: t("sharedMedia.files"), count: media.files.length },
    { key: "links", label: t("sharedMedia.links"), count: media.links.length },
  ]

  return (
    <>
      <div className="px-8 py-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[15px] font-bold text-[#1A1F1E]">{t("sharedMedia.title")}</span>
          {totalCount > 0 ? (
            <span className="text-[13px] font-semibold text-[#1A5345]">({totalCount})</span>
          ) : null}
        </div>

        {totalCount === 0 ? (
          <p className="text-[13px] text-muted-foreground">{t("sharedMedia.emptyHint")}</p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-[8px] px-3 py-1.5 text-[12px] font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === tab.key
                      ? "bg-[#1A5345] text-white"
                      : "text-muted-foreground hover:bg-slate-50 hover:text-[#1A1F1E]"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 ? ` (${tab.count})` : ""}
                </button>
              ))}
            </div>

            {activeTab === "photos" ? (
              media.photos.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">{t("sharedMedia.noPhotos")}</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {media.photos.map((item) => {
                    const imageUrl = resolveChatAttachmentUrl(item.url)
                    const fileName = item.fileName ?? t("sharedMedia.photo")
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            url: imageUrl,
                            fileName,
                          })
                        }
                        className="group aspect-square overflow-hidden rounded-[8px] border border-[#E8E6E0]/80 bg-[#F5F5F3] shadow-sm cursor-pointer"
                        aria-label={fileName}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={fileName}
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </button>
                    )
                  })}
                </div>
              )
            ) : null}

            {activeTab === "files" ? (
              media.files.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">{t("sharedMedia.noFiles")}</p>
              ) : (
                <div className="space-y-2">
                  {media.files.map((item) => (
                    <a
                      key={item.id}
                      href={resolveChatAttachmentUrl(item.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 rounded-xl border border-[#E8E6E0]/80 bg-[#F9F8F5] px-3 py-2.5 transition-colors hover:border-[#1A5345]/25 hover:bg-white"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white">
                        <FileIcon className="size-4 text-[#1A5345]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-[#1A1F1E]">
                          {item.fileName ?? t("sharedMedia.file")}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.sizeBytes ? formatFileSize(item.sizeBytes) : t("sharedMedia.document")}
                          {item.time ? ` · ${item.time}` : ""}
                        </p>
                      </div>
                      <ExternalLinkIcon className="size-3.5 shrink-0 text-muted-foreground group-hover:text-[#1A5345]" />
                    </a>
                  ))}
                </div>
              )
            ) : null}

            {activeTab === "links" ? (
              media.links.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">{t("sharedMedia.noLinks")}</p>
              ) : (
                <div className="space-y-2">
                  {media.links.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-start gap-3 rounded-xl border border-[#E8E6E0]/80 bg-[#F9F8F5] px-3 py-2.5 transition-colors hover:border-[#1A5345]/25 hover:bg-white"
                    >
                      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white">
                        <ExternalLinkIcon className="size-4 text-[#1A5345]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="break-all text-[13px] font-semibold text-[#1A5345] group-hover:underline">
                          {item.url}
                        </p>
                        {item.time ? (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{item.time}</p>
                        ) : null}
                      </div>
                    </a>
                  ))}
                </div>
              )
            ) : null}
          </>
        )}
      </div>

      {previewImage ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
          role="presentation"
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute end-4 top-4 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-medium text-white cursor-pointer"
          >
            {t("sharedMedia.close")}
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage.url}
            alt={previewImage.fileName}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  )
}

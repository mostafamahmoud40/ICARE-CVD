"use client"

import { useSearchParams } from "next/navigation"
import { AssistantProcedures } from "./AssistantProcedures"
import { useAssistantProcedures } from "./useAssistantProcedures"
import type { ViewMode } from "./AssistantProcedures"

export function AssistantProceduresPageContainer() {
  const searchParams = useSearchParams()
  const rawView = searchParams.get("view")
  const viewMode: ViewMode = rawView === "current" || rawView === "history" ? rawView : "operations"

  const {
    orders,
    stats,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    selectedOrder,
    selectOrder,
    clearSelection,
    onToggleRequirement,
    onUploadAttachment,
    onAddRequirement,
    onEditRequirement,
    onDeleteRequirement,
    onNotifyPatient,
    isNotifying,
    isTogglingRequirement,
    isUploadingAttachment,
    isLoading,
    isError,
  } = useAssistantProcedures()

  return (
    <AssistantProcedures
      orders={orders}
      stats={stats}
      filter={filter}
      setFilter={setFilter}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      selectedOrder={selectedOrder}
      selectOrder={selectOrder}
      clearSelection={clearSelection}
      onToggleRequirement={onToggleRequirement}
      onUploadAttachment={onUploadAttachment}
      onAddRequirement={onAddRequirement}
      onEditRequirement={onEditRequirement}
      onDeleteRequirement={onDeleteRequirement}
      onNotifyPatient={onNotifyPatient}
      isNotifying={isNotifying}
      isTogglingRequirement={isTogglingRequirement}
      isUploadingAttachment={isUploadingAttachment}
      isLoading={isLoading}
      isError={isError}
      viewMode={viewMode}
    />
  )
}

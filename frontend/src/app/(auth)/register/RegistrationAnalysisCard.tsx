"use client";

import { AlertCircle, Bot, Loader2, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type RegistrationAnalysisCardProps = {
  analysis: string | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  /** False after the summary is persisted server-side (refresh cannot change stored text). */
  canRefresh?: boolean;
  onRefresh: () => void;
};

export function RegistrationAnalysisCard({
  analysis,
  isLoading,
  isFetching,
  isError,
  canRefresh = true,
  onRefresh,
}: RegistrationAnalysisCardProps) {
  const summary = (analysis ?? "").trim();

  return (
    <div className="rounded-xl border border-[#E5EEEA] bg-white p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-violet-50 sm:size-8">
            <Bot className="size-3.5 text-violet-600 sm:size-4" />
          </div>
          <p className="text-[12px] font-semibold text-[#102F27] sm:text-[14px]">AI Registration Summary</p>
        </div>
        {canRefresh ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-[10px] sm:h-8 sm:text-[11px]"
            onClick={onRefresh}
            disabled={isFetching}
          >
            <RefreshCw className={`size-3 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        ) : (
          <p className="text-[10px] text-muted-foreground sm:text-[11px]">Saved</p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-lg bg-violet-50/50 px-3 py-4 text-[11px] text-violet-600 sm:text-[12px]">
          <Loader2 className="size-4 animate-spin" />
          Generating a concise summary from your registration data...
        </div>
      ) : null}

      {isError ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-700 dark:border-red-400/60 dark:bg-red-950/40 dark:text-red-200">
          <AlertCircle className="mt-0.5 size-4" />
          <AlertTitle>AI unavailable</AlertTitle>
          <AlertDescription>The local AI model is not available right now. Please ensure Ollama is running and try again.</AlertDescription>
        </Alert>
      ) : null}

      {summary ? (
        <div className="rounded-lg border border-violet-100 bg-violet-50/40 p-3 sm:p-4 dark:border-violet-400/20 dark:bg-violet-950/20">
          <p className="text-[11px] leading-relaxed text-[#1A1F1E] sm:text-[12px]">{summary}</p>
        </div>
      ) : null}
    </div>
  );
}

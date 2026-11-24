import React, { useEffect, useRef, useState } from "react";
import { useStore } from "@storagemaxxing/store/useStore";

const transition =
  "transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]";
const actionButton = `rounded-sm border border-border-default bg-surface-raised px-3 py-1 hover:bg-surface-hover ${transition}`;

const GITHUB_ISSUE_URL = (() => {
  const params = new URLSearchParams({
    title: "[Bug]: ",
    body: [
      "## Summary",
      "",
      "<!-- Describe what happened and what you expected -->",
      "",
      "## Repro state",
      "",
      "<!-- Paste the JSON from 'Copy repro JSON' here -->",
      "",
      "```json",
      "",
      "```",
    ].join("\n"),
  });
  return `https://github.com/mkobit/storagemaxxing/issues/new?${params.toString()}`;
})();

const buildReproSnapshot = () => {
  const { spaces, activeSpaceId, templatesById, constraintsBySpace } =
    useStore.getState();
  const activeSpace = spaces.find((s) => s.id === activeSpaceId) ?? null;
  const activeTemplate = activeSpace
    ? (templatesById[activeSpace.templateId] ?? null)
    : null;
  const activeConstraints = activeSpace
    ? (constraintsBySpace[activeSpace.templateId] ?? [])
    : [];

  return {
    spacesCount: spaces.length,
    activeSpace: activeSpace
      ? {
          id: activeSpace.id,
          name: activeSpace.name,
          system: activeSpace.system ?? null,
          count: activeSpace.count,
          template: activeTemplate,
          constraints: activeConstraints,
        }
      : null,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    url: window.location.href,
    userAgent: navigator.userAgent,
  };
};

export const FeedbackMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      if (prev) setCopied(false);
      return !prev;
    });
  };

  const handleCopyRepro = async (): Promise<void> => {
    const json = JSON.stringify(buildReproSnapshot(), null, 2);
    try {
      await navigator.clipboard?.writeText(json);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div ref={containerRef} className="relative" data-testid="feedback-menu">
      <button
        type="button"
        className={actionButton}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={handleToggle}
        data-testid="feedback-trigger"
      >
        Feedback
      </button>
      {isOpen && (
        <div
          role="dialog"
          aria-label="Feedback"
          data-testid="feedback-popover"
          className="absolute right-0 top-full z-30 mt-2 flex w-52 flex-col gap-2 rounded-sm border border-border-default bg-surface-raised p-3 shadow-lg"
        >
          <button
            type="button"
            className={`${actionButton} text-center text-sm`}
            onClick={handleCopyRepro}
            data-testid="copy-repro-json"
          >
            {copied ? "Copied" : "Copy repro JSON"}
          </button>
          <a
            href={GITHUB_ISSUE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${actionButton} text-center text-sm`}
            data-testid="open-github-issue"
          >
            Open GitHub issue
          </a>
        </div>
      )}
    </div>
  );
};

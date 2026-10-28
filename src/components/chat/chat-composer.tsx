"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/input-group";

type ChatComposerProps = {
  disabled?: boolean;
  placeholder?: string;
  onSend: (message: string) => Promise<boolean>;
};

export function ChatComposer({
  disabled = false,
  placeholder = "Ask a question about your sources…",
  onSend,
}: ChatComposerProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState("");

  async function submit() {
    const message = value.trim();
    if (!message || disabled) return;
    if (await onSend(message)) {
      setValue("");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  return (
    <form ref={formRef} className="chat-composer-form" onSubmit={handleSubmit}>
      <InputGroup className="chat-composer">
        <InputGroupTextarea
          aria-label="Ask your assistant a question"
          maxLength={2_000}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          value={value}
          disabled={disabled}
        />
        <InputGroupAddon align="block-end">
          <Button
            type="submit"
            size="icon"
            aria-label="Send message"
            disabled={!value.trim() || disabled}
          >
            <Send aria-hidden="true" />
          </Button>
        </InputGroupAddon>
      </InputGroup>
      <p className="composer-hint">
        <kbd>Enter</kbd> to send <span aria-hidden="true">·</span> <kbd>Shift + Enter</kbd> for a new line
      </p>
    </form>
  );
}

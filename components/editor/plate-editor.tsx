"use client";

import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Plate } from "@udecode/plate/react";

import { useCreateEditor } from "@/components/editor/use-create-editor";
import { SettingsDialog } from "@/components/editor/settings";
import { Editor, EditorContainer } from "@/components/plate-ui/editor";

import { useForm } from "react-hook-form";

type FormData = {
  content: any; // Replace 'any' with the appropriate type for your editor's value
};

export function PlateEditor() {
  const { register, handleSubmit, setValue } = useForm<FormData>();

  const editor = useCreateEditor();
  const onSubmit = (data: FormData) => {
    console.log("Submitted data:", data);
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <DndProvider backend={HTML5Backend}>
        <Plate editor={editor} onChange={(value) => setValue("content", value)}>
          <EditorContainer>
            <Editor variant="demo" />
          </EditorContainer>

          <SettingsDialog />
        </Plate>
      </DndProvider>
      <button type="submit">Submit</button>
    </form>
  );
}

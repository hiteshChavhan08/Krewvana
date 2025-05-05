import React from "react";
import type { DetailedQuestion } from "@/lib/qna";
import { Plate, PlateContent, usePlateEditor } from "@udecode/plate/react";
// import { plugins } from "@/lib/plate-plugins"; // Assuming you have a common plugins config
import { useCreateEditor } from "../editor/use-create-editor";
import { Editor } from "../plate-ui/editor";
import { log } from "console";
import { HeadingPlugin } from "@udecode/plate-heading/react";
import { BlockquotePlugin } from "@udecode/plate-block-quote/react";
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
} from "@udecode/plate-basic-marks/react";
import { EditorStatic } from "../plate-ui/editor-static";
import { serializeHtml } from "@udecode/plate";
import {viewComponents} from "@/components/editor/use-create-editor"

interface QuestionDetailProps {
  question: DetailedQuestion;
}


export const QuestionDetail: React.FC<QuestionDetailProps> = async ({ question }) => {
  // const value = JSON.parse(question.)
  const test = JSON.stringify(question.content); //Array.isArray(question.content) ? question.content : [];
  console.log(typeof test);
  console.log(test);
  
  
  const editor = usePlateEditor({
    plugins: [
      HeadingPlugin,
      BlockquotePlugin,
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
    ],
    value: [{"id":"I7w2MIITKy","type":"h3","children":[{"text":"Test","underline":true,"backgroundColor":"#FE0000"}]},{"id":"YrRaxCx6_Z","type":"p","children":[{"text":"nitis","backgroundColor":"#FE0000"},{"text":"h","strikethrough":true,"backgroundColor":"#FE0000"}]}]
  });

  const html = await serializeHtml(editor, {
    components:viewComponents,
    editorComponent: EditorStatic, // defaults to PlateStatic if not provided
    props: { variant: 'none', className: 'p-2' },
  });
  console.log(html);
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">{question.title}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Asked by {question.author?.name || "User"}
      </p>
      <div className="prose dark:prose-invert max-w-none">
        <Plate editor={editor}>
          {/* <Editor></Editor> */}
          <PlateContent />
        </Plate>
      </div>
    </div>
  );
};

import React, { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';

export function EditorAgendaNote(props) {
  const editorRef = useRef(null);
  const {block, blockindex, replaceBlock} = props;

  function save() {
      block.innerHTML = editorRef.current.getContent();
      replaceBlock(blockindex,block);
  }

  return (
    <>
      <Editor
        onInit={(evt, editor) => editorRef.current = editor}
        initialValue={block.innerHTML}
        init={{
          height: 100,
          menubar: false,
          toolbar: 'undo redo | bold italic | removeformat',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
        }}
      />
      <button className="tmform" onClick={save}>Update</button>
    </>
  );
}
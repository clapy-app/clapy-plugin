import { FC, memo, useEffect, useRef, useState } from 'react';
import { SelectedTextNode } from '../common/text-node-models';

interface Prop {
  node: SelectedTextNode;
  handleUpdateText: (figmaNodeID: string, text: string) => void;
}

export const TextItem: FC<Prop> = memo(function TextItem({ node, handleUpdateText }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(node.text);
  const inputRef: any = useRef();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div className='textItem'>
      {!isEditing ? (
        <div onClick={() => setIsEditing(true)}>{node.text}</div>
      ) : (
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              setIsEditing(false);
              handleUpdateText(node.figmaNodeID, text);
            }
          }}
        />
      )}
    </div>
  );
});

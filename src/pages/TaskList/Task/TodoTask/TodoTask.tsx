import React, {
  useRef,
  useMemo,
  useEffect,
  MouseEvent,
  KeyboardEvent
} from 'react';
import { useSelector } from 'react-redux';
import { Task, TaskProps } from '../Task';
import { TodoTaskMenu } from './TodoTaskMenu';
import { TodoTaskDetails, EditTaskButton } from '../TodoTaskDetails';
import {
  focusedSelector,
  useTaskActions,
  taskSelector
} from '../../../../store';
import { useMuiMenu } from '../../../../components/Mui';
import { useBoolean } from '../../../../hooks/useBoolean';
import { useMouseTrap } from '../../../../hooks/useMouseTrap';
import idx from 'idx.macro';

interface Props extends TaskProps {
  prev?: string;
  next?: string;
}

export const TodoTask = React.memo(({ uuid, prev, next, ...props }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const { createTask, deleteTask, updateTask, setFocus } = useTaskActions();
  const { onDelete, ...handler } = useMemo(() => {
    return {
      onDelete: () => deleteTask({ uuid }),
      // prevent focused task trigger `onBlur` event
      onMouseDown: (event: MouseEvent<HTMLElement>) => {
        !(event.target instanceof HTMLTextAreaElement) &&
          event.preventDefault();
      },
      onClick: (event: MouseEvent<HTMLElement>) => {
        event.currentTarget
          .querySelector<HTMLTextAreaElement>('textarea')!
          .focus();
      },
      onBlur: () => {
        // reduce unnecessary `FOCUS_TASK` action
        setTimeout(() => {
          const el = idx(
            document,
            d =>
              d.activeElement.parentElement.parentElement.parentElement
                .parentElement
          );
          (!el || !el.classList.contains('task')) && setFocus(null);
        }, 0);
      },
      onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => {
        const input = event.currentTarget;

        if (event.key === 'Enter') {
          event.preventDefault();
          createTask({ prevTask: uuid });
        }

        if (event.key === 'Backspace' && !input.value.trim()) {
          event.preventDefault();
          deleteTask({ uuid, prevTask: prev });
        }

        if (event.key === 'Escape') {
          input.blur();
        }

        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          const { selectionStart, selectionEnd, value } = input;
          const notHightlighted = selectionStart === selectionEnd;
          const shouldFocusPrev =
            event.key === 'ArrowUp' && selectionStart === 0;
          const shouldFocusNext =
            event.key === 'ArrowDown' && selectionStart === value.length;

          const to = event.key === 'ArrowUp' ? prev : next;

          if (notHightlighted && (shouldFocusPrev || shouldFocusNext) && to) {
            event.preventDefault();
            setFocus(to);
          }
        }
      }
    };
  }, [uuid, prev, next, createTask, deleteTask, setFocus]);

  const focused = useSelector(focusedSelector(uuid));

  const { title } = useSelector(taskSelector(uuid)) || {};

  const { anchorPosition, setAnchorPosition, onClose } = useMuiMenu();

  const [detailViewOpened, openDetailsView, closeDetailsView] = useBoolean();

  useEffect(() => {
    const el = ref.current;
    const input = el && el.querySelector<HTMLTextAreaElement>('textarea');
    if (input && focused) {
      const { length } = input.value;
      input.focus();
      // make sure cursor place at end of textarea
      input.setSelectionRange(length, length);
    }
  }, [focused]);

  useMouseTrap(focused ? 'shift+enter' : '', openDetailsView);

  return (
    <>
      <Task
        {...props}
        {...handler}
        ref={ref}
        uuid={uuid}
        value={title}
        isEmpty={!!(title && title.trim())}
        onContextMenu={setAnchorPosition}
        onFocus={() => !focused && setFocus(uuid)}
        onChange={event =>
          updateTask({ uuid, title: event.currentTarget.value })
        }
        className={['todo-task', focused ? 'focused' : ''].join(' ').trim()}
        endAdornment={<EditTaskButton onClick={openDetailsView} />}
      />
      <TodoTaskMenu
        uuid={uuid}
        keepMounted={false}
        anchorReference="anchorPosition"
        anchorPosition={anchorPosition}
        open={!!anchorPosition}
        onClose={onClose}
        onDelete={onDelete}
      />
      <TodoTaskDetails
        uuid={uuid}
        keepMounted={false}
        open={detailViewOpened}
        onClose={closeDetailsView}
        onDelete={onDelete}
      />
    </>
  );
});
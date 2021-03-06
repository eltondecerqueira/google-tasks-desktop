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
import { DateTimeDialog } from '../DateTimeDialog';
import {
  focusedSelector,
  useTaskActions,
  todoTaskSelector
} from '../../../../store';
import { useMuiMenu } from '../../../../components/Mui';
import { useBoolean } from '../../../../hooks/useBoolean';
import { useMouseTrap } from '../../../../hooks/useMouseTrap';
import idx from 'idx.macro';

export interface TodoTaskProps extends TaskProps {
  index: number;
}

export const TodoTask = React.memo(
  ({ uuid, index, className, ...props }: TodoTaskProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const {
      createTask,
      deleteTask,
      updateTask,
      moveTask,
      setFocus
    } = useTaskActions();

    const { onDelete, moveTaskUp, moveTaskDown, ...handler } = useMemo(() => {
      return {
        moveTaskUp: () => moveTask({ uuid, from: index, to: index - 1 }),
        moveTaskDown: () => moveTask({ uuid, from: index, to: index + 1 }),
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
            deleteTask({ uuid, prevTaskIndex: index - 1 });
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

            const to = event.key === 'ArrowUp' ? index - 1 : index + 1;

            if (notHightlighted && (shouldFocusPrev || shouldFocusNext)) {
              event.preventDefault();
              setFocus(to);
            }
          }
        }
      };
    }, [uuid, index, createTask, deleteTask, moveTask, setFocus]);

    const focused = useSelector(focusedSelector(uuid));

    const { title, due } = useSelector(todoTaskSelector(uuid)) || {};

    const { anchorPosition, setAnchorPosition, onClose } = useMuiMenu();

    const [detailViewOpened, openDetailsView, closeDetailsView] = useBoolean();
    const [
      dialogOpened,
      openDateTimeDialog,
      closeDateTimeDialog
    ] = useBoolean();

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
    useMouseTrap(focused ? 'option+up' : '', moveTaskUp);
    useMouseTrap(focused ? 'option+down' : '', moveTaskDown);

    return (
      <>
        <Task
          {...props}
          {...handler}
          ref={ref}
          uuid={uuid}
          value={title}
          isEmpty={!(title && title.trim())}
          onContextMenu={setAnchorPosition}
          onDueDateBtnClick={openDateTimeDialog}
          onFocus={() => !focused && setFocus(uuid)}
          onChange={event =>
            updateTask({ uuid, title: event.currentTarget.value })
          }
          className={['todo-task', focused ? 'focused' : '', className]
            .join(' ')
            .trim()}
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
          openDateTimeDialog={openDateTimeDialog}
        />
        <TodoTaskDetails
          uuid={uuid}
          keepMounted={false}
          open={detailViewOpened}
          onClose={closeDetailsView}
          onDelete={onDelete}
          openDateTimeDialog={openDateTimeDialog}
        />
        <DateTimeDialog
          date={due ? new Date(due) : undefined}
          open={dialogOpened}
          onClose={closeDateTimeDialog}
          onConfirm={date => updateTask({ uuid, due: date.toISODateString() })}
        />
      </>
    );
  }
);

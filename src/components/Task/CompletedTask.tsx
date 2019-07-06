import React, { useCallback } from 'react';
import { connect, DispatchProp } from 'react-redux';
import { Task } from '../Task';
import { DeleteIcon, IconButton } from '../Mui';
import { RootState, deleteTask } from '../../store';
import { Schema$Task } from '../../typings';

interface Props extends Pick<Schema$Task, 'uuid'> {}

const mapStateToProps = (state: RootState, ownProps: Props) => {
  return {
    ...ownProps,
    task: state.task.byIds[ownProps.uuid]
  };
};

const inputProps = {
  hideDateBtn: true
};

function CompletedTaskComponent({
  task,
  dispatch
}: ReturnType<typeof mapStateToProps> & DispatchProp) {
  const deleteTaskCallback = useCallback(
    () => dispatch(deleteTask({ id: task.id, uuid: task.uuid })),
    [dispatch, task.id, task.uuid]
  );

  return (
    <Task
      uuid={task.uuid}
      title={task.title}
      status={task.status}
      readOnly
      className="completed-task"
      inputProps={inputProps}
      endAdornment={
        <IconButton
          tooltip="Delete"
          icon={DeleteIcon}
          onClick={deleteTaskCallback}
        />
      }
    />
  );
}

export const CompletedTask = connect(mapStateToProps)(CompletedTaskComponent);
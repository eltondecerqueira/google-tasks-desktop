import React, { useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import { Dispatch, bindActionCreators } from 'redux';
import { tasks_v1 } from 'googleapis';
import { Task } from '../Task';
import { NewTask } from '../NewTask';
import { TaskState, TaskActionCreators, RootState } from '../../store';
import { Schema$Task } from '../../typings';

interface Props {
  taskListId: string;
}

const mapStateToProps = ({ task }: RootState) => ({ ...task });
const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators(TaskActionCreators, dispatch);

function TaskListContentComponent({
  tasks,
  taskListId,
  getAllTasks,
  addTask,
  deleteTask
}: TaskState & typeof TaskActionCreators & Props) {
  const wrappedAddTask = useCallback(
    (requestBody?: tasks_v1.Schema$Task) => {
      return addTask({
        tasklist: taskListId,
        requestBody
      });
    },
    [addTask, taskListId]
  );

  const wrappedDeleteTask = useCallback(
    (task: Schema$Task) => {
      return deleteTask({
        taskListId,
        ...task
      });
    },
    [deleteTask, taskListId]
  );

  useEffect(() => {
    taskListId &&
      getAllTasks({
        tasklist: taskListId
      });
  }, [getAllTasks, taskListId]);

  return (
    <div className="task-list-content">
      <NewTask addTask={wrappedAddTask} />
      {tasks.map(task => (
        <Task key={task.id} task={task} deleteTask={wrappedDeleteTask} />
      ))}
    </div>
  );
}

export const TaskListContent = connect(
  mapStateToProps,
  mapDispatchToProps
)(TaskListContentComponent);
'use client'

import React from 'react';
import clsx from 'clsx';

import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from '@headlessui/react';

import DeleteTaskButton from './DeleteTaskButton';


type TaskItemMenuProps = {
  taskId: number;
}

const TaskItemMenu: React.FC<TaskItemMenuProps> = ({
  taskId,
}) => (
  <Menu>
    <MenuButton className='ms-auto outline-none border-none'>
      <EllipsisVerticalIcon className='size-4' />
    </MenuButton>
    <MenuItems
      anchor='bottom end'
      className={clsx(
        'w-fit origin-top-left rounded-xl border border-white/5 bg-white/5',
        'transition duration-100 ease-out p-2'
      )} 
    >
        <MenuItem>
          <DeleteTaskButton taskId={taskId} />
        </MenuItem>
    </MenuItems>
  </Menu>
);

export default TaskItemMenu;


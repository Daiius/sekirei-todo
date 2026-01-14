import { 
  getTasks as getTasksDb, 
  insertTask as insertTaskDb, 
  updateTask as updateTaskDb,
  deleteTask as deleteTaskDb,
} from 'database/db/lib'
import type { 
  Task,
  NewTask, 
  UpdatedTask,
} from 'database/db/lib'


type StatusCode = 400 | 401 | 500

export type ApiResult<T> =
  | { success: true, data: T }
  | { success: false, error: { message: string, statusCode: StatusCode; } }

export const getTasks = async (userId: string): Promise<ApiResult<Task[]>> => {
  try { 
    const result = await getTasksDb(userId)
    return {
      success: true,
      data: result,
    }
  } catch (err) {
    console.error('error @ getTasks: ', err)
    return {
      success: false,
      error: {
        message: String(err),
        statusCode: 500,
      }
    }
  }
}




export const addTask = async (
  newTask: NewTask,
  userId: string,
): Promise<ApiResult<NewTask>> => {
  try {
    await insertTaskDb(userId, newTask)   
    return {
      success: true,
      data: newTask,
    }
  } catch (err) {
    console.error('error @ addTask: ', err)
    return {
      success: false,
      error: {
        message: String(err),
        statusCode: 500,
      }
    }
  }
}

export const updateTask = async (updatedTask: UpdatedTask): Promise<ApiResult<UpdatedTask>> => {
  try {
    await updateTaskDb(updatedTask)
    return {
      success:true,
      data: updatedTask
    }
  } catch (err) {
    console.error('error @ updateTask: ', err)
    return {
      success: false,
      error: {
        message: String(err),
        statusCode: 500,
      }
    }
  }
}

export const deleteTask = async (
  userId: string, 
  taskId: number
): Promise<ApiResult<undefined>> => {
  try {
    await deleteTaskDb(userId, taskId)
    return { success: true, data: undefined }
  } catch (err) {
    console.error('error @ deleteTask: ', err)
    return {
      success: false,
      error: {
        message: String(err),
        statusCode: 500,
      }
    }
  }
}

export { UpdatedTaskSchema, NewTaskSchema } from 'database/db/lib'

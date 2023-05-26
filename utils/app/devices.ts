import { v4 as uuidv4 } from 'uuid';

export const getDeviceId = () => {
  const deviceId = localStorage.getItem('__device_id__')

  if (deviceId) {
    return deviceId
  } else {
    const newDeviceId = uuidv4()
    localStorage.setItem('__device_id__', newDeviceId)
    return newDeviceId
  }
};

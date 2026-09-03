import { createSlice } from '@reduxjs/toolkit'

const storedUser = localStorage.getItem('bun-maska-user')

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: Boolean(storedUser),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = true
      localStorage.setItem('bun-maska-user', JSON.stringify(action.payload))
    },
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('bun-maska-user')
    },
  },
})

export const { login, logout } = authSlice.actions
export default authSlice.reducer
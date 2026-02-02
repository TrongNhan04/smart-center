import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

interface User {
	id: number,
	email: string,
	phone: string,
	full_name:string
	role: 'ADMIN' | 'TEACHER'
}

interface AuthState {
	user: User | null,
	access_token: string | null,

	login: (user: User, token: string) => void,
	logout: () => void
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			user: null,
			access_token: null,

			login: (userData, token) => set({
				user: userData,
				access_token: token
			}),
			
			logout: () => set({
				user: null,
				access_token: null
			})
		}),
		{
			name: 'auth-storage',
			storage: createJSONStorage(() => localStorage)
		}
	)
)
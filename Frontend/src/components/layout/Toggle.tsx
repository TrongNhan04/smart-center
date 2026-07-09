import { MoonFilled, SunFilled } from '@ant-design/icons'
import { Button } from 'antd'

interface ToggleProps {
	darkTheme: boolean,
	toggleTheme: () => void
}

const Toggle = ({ darkTheme, toggleTheme }: ToggleProps) => {
	return (
		<div className='toggle-theme-btn'>
			<Button onClick={toggleTheme}>
				{darkTheme ? <SunFilled /> : <MoonFilled />}</Button>
		</div>
	)
}

export default Toggle
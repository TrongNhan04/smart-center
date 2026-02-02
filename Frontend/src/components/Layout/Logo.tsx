import { SlackCircleFilled } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const Logo = () => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/admin/home')
  }

  return (
    <div className="logo">
      <div className="logo-icon" onClick={handleClick}>
        <SlackCircleFilled />
      </div>
    </div>
  )
}

export default Logo
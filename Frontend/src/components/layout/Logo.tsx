import { SlackCircleFilled } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const Logo = () => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/admin/dashboard')
  }

  return (
    <div className="logo">
      <div className="logo-icon" onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <SlackCircleFilled />
      </div>
    </div>
  )
}

export default Logo
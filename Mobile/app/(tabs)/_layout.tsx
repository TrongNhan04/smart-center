import { Tabs } from 'expo-router'
import React from 'react'

const TabLayout = () => {
    return (
        <Tabs>
					<Tabs.Screen name='index' options={{title:'Home'}}></Tabs.Screen>
					<Tabs.Screen name='about' options={{title:'About'}}></Tabs.Screen>
				</Tabs>
    )
}

export default TabLayout
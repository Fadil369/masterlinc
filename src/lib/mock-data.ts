import type { Agent, Message, SystemHealth } from './types'
import { MockDataGenerator } from './mock/mock-data-generator'

/**
 * Mock data for the UI.
 *
 * This file intentionally preserves the legacy exports used by the app.
 * Internally it uses a Factory/Builder/Scenario generator architecture.
 */

const generator = new MockDataGenerator()
const bundle = generator.generate('default')

export const mockAgents: Agent[] = bundle.agents
export const mockMessages: Message[] = bundle.messages
export const mockSystemHealth: SystemHealth = bundle.systemHealth

export const mockDataVersion = bundle.version
export const mockScenario = bundle.scenario

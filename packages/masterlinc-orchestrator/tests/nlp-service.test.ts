
import { NlpService } from '../src/services/nlp-service';

// Mock Anthropic client (since we don't want to make real API calls in unit tests)
jest.mock('@anthropic-ai/sdk', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
            messages: {
                create: jest.fn()
            }
        }))
    };
});

describe('NlpService', () => {
    let nlpService: NlpService;

    beforeEach(() => {
        nlpService = new NlpService('dummy-api-key');
    });

    describe('determineDepartment', () => {
        it('should map chest symptoms to cardiology', () => {
            expect(nlpService.determineDepartment(['chest pain'])).toBe('cardiology');
        });

        it('should map head symptoms to neurology', () => {
            expect(nlpService.determineDepartment(['severe headache'])).toBe('neurology');
        });

        it('should default to general-practice', () => {
            expect(nlpService.determineDepartment(['tiredness'])).toBe('general-practice');
        });

        it('should handle empty symptoms list', () => {
            expect(nlpService.determineDepartment([])).toBe('general-practice');
        });
    });
});

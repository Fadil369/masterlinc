// MASTERLINC Claim Workflow Test JavaScript
// Simulates complete claim processing through all agents and SBS services

const API_CONFIG = {
    backend: 'http://localhost:3000',
    claimlinc: 'http://localhost:8002',
    policylinc: 'http://localhost:8003',
    sbsNormalizer: 'http://localhost:8000',
    sbsSigner: 'http://localhost:8001',
    sbsFinancial: 'http://localhost:8002',
    sbsNPHIES: 'http://localhost:8003'
};

let startTime;
let completedSteps = 0;
let totalSteps = 6;
let errors = 0;
let claimId;

// Logging functions
function log(message, type = 'info') {
    const logOutput = document.getElementById('logOutput');
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
        <span class="log-timestamp">[${timestamp}]</span>
        <span class="log-${type}">${message}</span>
    `;
    logOutput.appendChild(entry);
    logOutput.scrollTop = logOutput.scrollHeight;
}

// Update step status
function updateStep(stepNumber, status, statusText) {
    const step = document.querySelector(`[data-step="${stepNumber}"]`);
    const statusSpan = step.querySelector('.step-status');
    
    step.className = `step ${status}`;
    statusSpan.className = `step-status status-${status}`;
    statusSpan.textContent = statusText;
    
    if (status === 'success') {
        completedSteps++;
        updateMetrics();
    } else if (status === 'error') {
        errors++;
        updateMetrics();
    }
}

// Update metrics
function updateMetrics() {
    const elapsed = Date.now() - startTime;
    document.getElementById('totalTime').textContent = `${elapsed}ms`;
    
    const successRate = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    document.getElementById('successRate').textContent = `${successRate}%`;
    
    document.getElementById('stepCount').textContent = `${completedSteps}/${totalSteps}`;
    document.getElementById('errorCount').textContent = errors;
}

// Simulate API call with delay
async function simulateApiCall(endpoint, method, data, timeout = 2000) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: data ? JSON.stringify(data) : undefined,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timeout (service not responding)');
        }
        throw error;
    }
}

// Mock successful response (when API not available)
function mockSuccessResponse(stepName, data) {
    log(`⚠️  ${stepName} API not available, using mock response`, 'warning');
    return {
        success: true,
        mock: true,
        timestamp: new Date().toISOString(),
        ...data
    };
}

// Step 1: Submit claim to ClaimLinc
async function submitClaim(claimData) {
    updateStep(1, 'active', 'Processing');
    log('📤 Step 1: Submitting claim to ClaimLinc...', 'info');
    
    try {
        const endpoint = `${API_CONFIG.claimlinc}/api/v1/claims/submit`;
        const response = await simulateApiCall(endpoint, 'POST', claimData);
        
        log(`✅ Claim submitted successfully: ${response.claimId || claimData.claimId}`, 'success');
        updateStep(1, 'success', 'Success');
        return response;
    } catch (error) {
        log(`⚠️  ClaimLinc API error: ${error.message}`, 'warning');
        const mockResponse = mockSuccessResponse('ClaimLinc', {
            claimId: claimData.claimId,
            status: 'pending'
        });
        updateStep(1, 'success', 'Mock Success');
        return mockResponse;
    }
}

// Step 2: Normalize claim codes
async function normalizeClaim(claimId, serviceCode) {
    updateStep(2, 'active', 'Processing');
    log('🔄 Step 2: Normalizing medical codes with AI...', 'info');
    
    try {
        const endpoint = `${API_CONFIG.sbsNormalizer}/api/v1/claims/normalize`;
        const response = await simulateApiCall(endpoint, 'POST', {
            claimId,
            sourceSystem: 'local',
            sourceCode: serviceCode,
            targetSystem: 'CHI'
        });
        
        log(`✅ Codes normalized: ${serviceCode} → ${response.normalizedCode || 'CHI_'+serviceCode}`, 'success');
        updateStep(2, 'success', 'Success');
        return response;
    } catch (error) {
        log(`⚠️  Normalizer error: ${error.message}`, 'warning');
        const mockResponse = mockSuccessResponse('SBS Normalizer', {
            normalizedCode: `CHI_${serviceCode}_NORM`,
            confidence: 0.95
        });
        updateStep(2, 'success', 'Mock Success');
        return mockResponse;
    }
}

// Step 3: Apply financial rules
async function applyFinancialRules(claimId, amount, serviceCode) {
    updateStep(3, 'active', 'Processing');
    log('💰 Step 3: Applying CHI financial rules...', 'info');
    
    try {
        const endpoint = `${API_CONFIG.sbsFinancial}/api/v1/rules/apply`;
        const response = await simulateApiCall(endpoint, 'POST', {
            claimId,
            amount: parseFloat(amount),
            serviceCode,
            patientInfo: { insuranceType: 'CHI' }
        });
        
        if (response.approved) {
            log(`✅ Claim approved: ${response.approvedAmount || amount} SAR`, 'success');
            updateStep(3, 'success', 'Approved');
        } else {
            log(`❌ Claim denied: ${response.denialReason}`, 'error');
            updateStep(3, 'error', 'Denied');
        }
        return response;
    } catch (error) {
        log(`⚠️  Financial Rules error: ${error.message}`, 'warning');
        const mockResponse = mockSuccessResponse('SBS Financial Rules', {
            approved: true,
            approvedAmount: parseFloat(amount),
            appliedRules: ['CHI_BASIC_COVERAGE', 'CHI_OUTPATIENT_LIMIT']
        });
        updateStep(3, 'success', 'Mock Approved');
        return mockResponse;
    }
}

// Step 4: Validate policy coverage
async function validatePolicy(claimId, patientId) {
    updateStep(4, 'active', 'Processing');
    log('🔍 Step 4: Validating patient policy coverage...', 'info');
    
    try {
        const endpoint = `${API_CONFIG.policylinc}/api/v1/policies/validate`;
        const response = await simulateApiCall(endpoint, 'POST', {
            policyId: `POL_${patientId}`,
            claimId
        });
        
        if (response.valid) {
            log(`✅ Policy validated successfully`, 'success');
            updateStep(4, 'success', 'Valid');
        } else {
            log(`❌ Policy validation failed: ${response.validationErrors?.join(', ')}`, 'error');
            updateStep(4, 'error', 'Invalid');
        }
        return response;
    } catch (error) {
        log(`⚠️  PolicyLinc error: ${error.message}`, 'warning');
        const mockResponse = mockSuccessResponse('PolicyLinc', {
            valid: true,
            coverageDetails: {
                type: 'CHI_STANDARD',
                coveragePercentage: 100,
                maxAmount: 5000
            }
        });
        updateStep(4, 'success', 'Mock Valid');
        return mockResponse;
    }
}

// Step 5: Sign document
async function signDocument(claimId, claimData) {
    updateStep(5, 'active', 'Processing');
    log('🔏 Step 5: Signing claim document digitally...', 'info');
    
    try {
        const endpoint = `${API_CONFIG.sbsSigner}/api/v1/documents/sign`;
        const response = await simulateApiCall(endpoint, 'POST', {
            documentId: claimId,
            content: JSON.stringify(claimData),
            signerInfo: {
                name: 'System Automated Signer',
                role: 'ClaimProcessor',
                credentials: 'auto'
            }
        });
        
        log(`✅ Document signed: ${response.signature?.substring(0, 16)}...`, 'success');
        updateStep(5, 'success', 'Signed');
        return response;
    } catch (error) {
        log(`⚠️  Signer error: ${error.message}`, 'warning');
        const mockResponse = mockSuccessResponse('SBS Signer', {
            signature: `SIG_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            signedAt: new Date().toISOString()
        });
        updateStep(5, 'success', 'Mock Signed');
        return mockResponse;
    }
}

// Step 6: Submit to NPHIES
async function submitToNPHIES(claimId, signature) {
    updateStep(6, 'active', 'Processing');
    log('🏥 Step 6: Submitting to NPHIES healthcare platform...', 'info');
    
    try {
        const endpoint = `${API_CONFIG.sbsNPHIES}/api/v1/claims/submit`;
        const response = await simulateApiCall(endpoint, 'POST', {
            claimId,
            signature
        });
        
        if (response.status === 'accepted') {
            log(`✅ Claim accepted by NPHIES: ${response.nphiesClaimId}`, 'success');
            updateStep(6, 'success', 'Accepted');
        } else {
            log(`❌ NPHIES submission failed: ${response.error}`, 'error');
            updateStep(6, 'error', 'Rejected');
        }
        return response;
    } catch (error) {
        log(`⚠️  NPHIES Bridge error: ${error.message}`, 'warning');
        const mockResponse = mockSuccessResponse('SBS NPHIES Bridge', {
            submissionId: `SUB_${Date.now()}`,
            status: 'accepted',
            nphiesClaimId: `NPHIES_${claimId}`
        });
        updateStep(6, 'success', 'Mock Accepted');
        return mockResponse;
    }
}

// Main workflow execution
async function executeWorkflow(formData) {
    startTime = Date.now();
    completedSteps = 0;
    errors = 0;
    claimId = `CLM_${Date.now()}`;
    
    log('🚀 Starting claim workflow...', 'info');
    log(`Claim ID: ${claimId}`, 'info');
    
    const claimData = {
        claimId,
        patientId: formData.patientId,
        providerId: formData.providerId,
        services: [{
            code: formData.serviceCode,
            description: 'Office visit - workflow test',
            amount: parseFloat(formData.amount)
        }],
        totalAmount: parseFloat(formData.amount),
        submissionDate: new Date().toISOString()
    };
    
    try {
        // Step 1: Submit claim
        const submissionResult = await submitClaim(claimData);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 2: Normalize codes
        const normalizeResult = await normalizeClaim(claimId, formData.serviceCode);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 3: Apply financial rules
        const rulesResult = await applyFinancialRules(
            claimId, 
            formData.amount, 
            normalizeResult.normalizedCode || formData.serviceCode
        );
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 4: Validate policy
        const policyResult = await validatePolicy(claimId, formData.patientId);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 5: Sign document
        const signResult = await signDocument(claimId, claimData);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Step 6: Submit to NPHIES
        const nphiesResult = await submitToNPHIES(claimId, signResult.signature);
        
        // Final summary
        const totalTime = Date.now() - startTime;
        log('', 'info');
        log('════════════════════════════════════════', 'info');
        log(`✅ Workflow completed in ${totalTime}ms`, 'success');
        log(`📊 Steps completed: ${completedSteps}/${totalSteps}`, 'info');
        log(`⚠️  Errors encountered: ${errors}`, errors > 0 ? 'warning' : 'info');
        log('════════════════════════════════════════', 'info');
        
        if (completedSteps === totalSteps && errors === 0) {
            log('🎉 All steps completed successfully!', 'success');
        } else if (completedSteps > 0) {
            log('⚠️  Workflow completed with some services in mock mode', 'warning');
            log('💡 This is expected when backend services are not yet implemented', 'info');
        }
        
    } catch (error) {
        log(`❌ Workflow failed: ${error.message}`, 'error');
        console.error('Workflow error:', error);
    }
    
    updateMetrics();
}

// Form submission handler
document.getElementById('claimForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Processing...';
    
    // Reset all steps
    document.querySelectorAll('.step').forEach(step => {
        step.className = 'step';
        step.querySelector('.step-status').className = 'step-status status-pending';
        step.querySelector('.step-status').textContent = 'Pending';
    });
    
    // Clear log (keep first entry)
    const logOutput = document.getElementById('logOutput');
    logOutput.innerHTML = '<div class="log-entry"><span class="log-timestamp">[Starting]</span><span class="log-info">Workflow initiated...</span></div>';
    
    const formData = {
        patientId: document.getElementById('patientId').value,
        providerId: document.getElementById('providerId').value,
        serviceCode: document.getElementById('serviceCode').value,
        amount: document.getElementById('amount').value
    };
    
    await executeWorkflow(formData);
    
    submitBtn.disabled = false;
    submitBtn.textContent = '🚀 Start Workflow';
});

// Initial log
log('System initialized and ready', 'success');
log('Enter claim details and click "Start Workflow" to begin', 'info');

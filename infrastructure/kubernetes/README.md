# Kubernetes Deployment Guide

Deploy MASTERLINC to Kubernetes cluster.

## Prerequisites

- Kubernetes 1.27+ cluster
- kubectl configured
- Helm 3+ (optional, for advanced deployments)
- Container registry access (for pulling images)

## Quick Start

### 1. Create Namespace

```bash
kubectl apply -f namespace.yaml
```

### 2. Create Secrets

Update `secrets.yaml` with your actual credentials:

```bash
# Edit secrets
vi secrets.yaml

# Apply secrets
kubectl apply -f secrets.yaml
```

**Important:** Change all `CHANGE_ME_IN_PRODUCTION` values!

### 3. Apply ConfigMaps

```bash
kubectl apply -f configmaps.yaml
```

### 4. Deploy Core Services

```bash
kubectl apply -f deployments/core-services.yaml
kubectl apply -f services/core-services.yaml
```

### 5. Setup Ingress

Update `ingress.yaml` with your domain:

```bash
# Edit ingress
vi ingress.yaml

# Apply ingress
kubectl apply -f ingress.yaml
```

### 6. Verify Deployment

```bash
# Check pods
kubectl get pods -n masterlinc

# Check services
kubectl get svc -n masterlinc

# Check ingress
kubectl get ingress -n masterlinc

# View logs
kubectl logs -n masterlinc -l app=masterlinc-api
```

## Accessing Services

### Internal Access

From within the cluster:

```bash
# MasterLinc API
http://masterlinc-service.masterlinc.svc.cluster.local:8000

# ClaimLinc API
http://claimlinc-service.masterlinc.svc.cluster.local:8001

# PostgreSQL
postgresql://postgres-service.masterlinc.svc.cluster.local:5432
```

### External Access

Through ingress:

```bash
# API endpoints
https://api.masterlinc.example.com/api/v1/orchestrator
https://api.masterlinc.example.com/api/v1/claims
https://api.masterlinc.example.com/fhir
```

## Scaling

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: masterlinc-hpa
  namespace: masterlinc
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: masterlinc-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

Apply:

```bash
kubectl apply -f hpa.yaml
```

### Manual Scaling

```bash
# Scale masterlinc-api to 5 replicas
kubectl scale deployment masterlinc-api -n masterlinc --replicas=5

# Scale claimlinc-api to 3 replicas
kubectl scale deployment claimlinc-api -n masterlinc --replicas=3
```

## Monitoring

### Check Resource Usage

```bash
# Pod resource usage
kubectl top pods -n masterlinc

# Node resource usage
kubectl top nodes
```

### View Logs

```bash
# Stream logs
kubectl logs -n masterlinc -l app=masterlinc-api -f

# Get logs from specific pod
kubectl logs -n masterlinc masterlinc-api-<pod-id>

# Get previous pod logs (after crash)
kubectl logs -n masterlinc masterlinc-api-<pod-id> --previous
```

### Describe Resources

```bash
# Describe pod
kubectl describe pod -n masterlinc masterlinc-api-<pod-id>

# Describe service
kubectl describe svc -n masterlinc masterlinc-service
```

## Troubleshooting

### Pods Not Starting

```bash
# Check events
kubectl get events -n masterlinc --sort-by='.lastTimestamp'

# Check pod status
kubectl get pods -n masterlinc
kubectl describe pod -n masterlinc <pod-name>

# Check container logs
kubectl logs -n masterlinc <pod-name> -c <container-name>
```

### Image Pull Errors

```bash
# Check image pull secrets
kubectl get secrets -n masterlinc

# Create image pull secret
kubectl create secret docker-registry regcred \
  --docker-server=ghcr.io \
  --docker-username=<username> \
  --docker-password=<token> \
  -n masterlinc

# Add to deployment
kubectl patch deployment masterlinc-api -n masterlinc \
  -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"regcred"}]}}}}'
```

### Database Connection Issues

```bash
# Check PostgreSQL pod
kubectl get pods -n masterlinc -l app=postgres

# Connect to PostgreSQL
kubectl exec -it -n masterlinc <postgres-pod> -- psql -U masterlinc

# Check service endpoints
kubectl get endpoints -n masterlinc postgres-service
```

### Health Check Failures

```bash
# Check health endpoint manually
kubectl exec -it -n masterlinc <pod-name> -- curl http://localhost:8000/health

# Adjust probe timing if needed
kubectl edit deployment masterlinc-api -n masterlinc
```

## Updating Deployments

### Rolling Update

```bash
# Update image
kubectl set image deployment/masterlinc-api \
  masterlinc-api=ghcr.io/fadil369/masterlinc-api:v2.0.0 \
  -n masterlinc

# Watch rollout
kubectl rollout status deployment/masterlinc-api -n masterlinc
```

### Rollback

```bash
# View rollout history
kubectl rollout history deployment/masterlinc-api -n masterlinc

# Rollback to previous version
kubectl rollout undo deployment/masterlinc-api -n masterlinc

# Rollback to specific revision
kubectl rollout undo deployment/masterlinc-api --to-revision=2 -n masterlinc
```

## Backup and Recovery

### Database Backup

```bash
# Create backup job
kubectl create job --from=cronjob/postgres-backup backup-$(date +%Y%m%d) -n masterlinc

# Manual backup
kubectl exec -n masterlinc <postgres-pod> -- \
  pg_dump -U masterlinc masterlinc > backup.sql
```

### ConfigMap Backup

```bash
# Export all configmaps
kubectl get configmap -n masterlinc -o yaml > configmaps-backup.yaml

# Export secrets (encrypted)
kubectl get secrets -n masterlinc -o yaml > secrets-backup.yaml
```

## Cleanup

```bash
# Delete all resources in namespace
kubectl delete namespace masterlinc

# Or delete individually
kubectl delete -f deployments/
kubectl delete -f services/
kubectl delete -f configmaps.yaml
kubectl delete -f secrets.yaml
kubectl delete -f namespace.yaml
```

## Production Checklist

- [ ] Update all secrets with strong credentials
- [ ] Configure SSL/TLS certificates
- [ ] Set up Horizontal Pod Autoscaler
- [ ] Configure persistent volume backups
- [ ] Set resource requests and limits
- [ ] Configure network policies
- [ ] Set up monitoring and alerting
- [ ] Configure log aggregation
- [ ] Test disaster recovery procedures
- [ ] Document runbooks

## Support

For issues:
- GitHub: https://github.com/Fadil369/masterlinc/issues
- Docs: https://github.com/Fadil369/masterlinc/tree/main/docs

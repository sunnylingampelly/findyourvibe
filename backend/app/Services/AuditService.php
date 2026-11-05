<?php

namespace App\Services;

use App\Models\AdminAuditLog;
use Illuminate\Http\Request;

class AuditService
{
    public function log(
        string $action,
        ?string $adminId = null,
        ?string $entityType = null,
        ?string $entityId = null,
        ?array $data = null,
        ?string $ipAddress = null
    ): AdminAuditLog {
        return AdminAuditLog::create([
            'admin_id' => $adminId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'data' => $data,
            'ip_address' => $ipAddress,
        ]);
    }

    public function logFromRequest(Request $request, string $action, ?string $entityType = null, ?string $entityId = null, ?array $data = null): AdminAuditLog
    {
        return $this->log(
            action: $action,
            adminId: $request->user()?->id,
            entityType: $entityType,
            entityId: $entityId,
            data: $data,
            ipAddress: $request->ip(),
        );
    }
}

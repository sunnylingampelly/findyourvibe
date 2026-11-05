<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanionDocument extends Model
{
    use HasFactory;

    protected $fillable = ['companion_application_id', 'document_type', 'file_path', 'original_name', 'mime_type'];

    public function application(): BelongsTo
    {
        return $this->belongsTo(CompanionApplication::class, 'companion_application_id');
    }
}

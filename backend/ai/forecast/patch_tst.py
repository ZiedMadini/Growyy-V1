"""
PatchTST — A Time Series is Worth 64 Words (Nie et al., ICLR 2023).
Simplified univariate implementation for Growy sensor forecasting.

Input:  (B, seq_len)       — raw 10-min readings (1008 = 7 days × 144 ticks)
Output: (B, pred_len)      — future daily averages (5 values)

Architecture:
  1. Patch embed  : split into overlapping patches of length P, stride S
  2. Linear proj  : project each patch to d_model
  3. Pos embed    : learnable positional encoding
  4. Transformer  : n_layers of multi-head self-attention + FFN
  5. Flatten + FC : map to pred_len outputs
"""

import math
import torch
import torch.nn as nn


class PatchEmbedding(nn.Module):
    def __init__(self, seq_len: int, patch_len: int, stride: int, d_model: int):
        super().__init__()
        self.patch_len = patch_len
        self.stride = stride
        n_patches = (seq_len - patch_len) // stride + 1
        self.proj = nn.Linear(patch_len, d_model)
        self.pos = nn.Parameter(torch.zeros(1, n_patches, d_model))
        nn.init.trunc_normal_(self.pos, std=0.02)
        self.n_patches = n_patches

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, seq_len)
        patches = x.unfold(1, self.patch_len, self.stride)   # (B, n_patches, patch_len)
        out = self.proj(patches) + self.pos                   # (B, n_patches, d_model)
        return out


class PatchTST(nn.Module):
    """
    Hyperparameters chosen for the RTX 3050 / 4GB VRAM budget:
      seq_len=1008, patch_len=24, stride=12 → 83 patches
      d_model=64, n_heads=4, n_layers=2, d_ff=256
      ~500K parameters, <20ms inference on CPU
    """

    def __init__(
        self,
        seq_len: int = 1008,
        pred_len: int = 5,
        patch_len: int = 24,
        stride: int = 12,
        d_model: int = 64,
        n_heads: int = 4,
        n_layers: int = 2,
        d_ff: int = 256,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.patch_embed = PatchEmbedding(seq_len, patch_len, stride, d_model)
        n_patches = self.patch_embed.n_patches

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=n_heads,
            dim_feedforward=d_ff,
            dropout=dropout,
            batch_first=True,
            norm_first=True,   # Pre-LN for training stability
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=n_layers)
        self.norm = nn.LayerNorm(d_model)
        self.head = nn.Linear(n_patches * d_model, pred_len)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (B, seq_len)  — normalized input
        patches = self.patch_embed(x)               # (B, n_patches, d_model)
        patches = self.dropout(patches)
        encoded = self.transformer(patches)          # (B, n_patches, d_model)
        encoded = self.norm(encoded)
        flat = encoded.flatten(1)                    # (B, n_patches * d_model)
        return self.head(flat)                       # (B, pred_len)

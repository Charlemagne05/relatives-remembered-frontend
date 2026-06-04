import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  Box, Typography, Button, Card, CardContent, Divider, Chip, Alert,
  ToggleButtonGroup, ToggleButton, CircularProgress, TextField,
  IconButton, List, ListItem, ListItemText,
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import BlockIcon from '@mui/icons-material/Block';
import PaletteIcon from '@mui/icons-material/Palette';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AbcIcon from '@mui/icons-material/Abc';
import {
  getAdminReports, dismissReports, deleteStory,
  getBannedWords, addBannedWord, deleteBannedWord,
  type ReportedStory, type BannedWord,
} from '../../api';

const COLOR_LABELS: Record<string, string> = {
  'linear-gradient(to bottom, #f8fafc, #f1f5f9)': 'Défaut (Gris)',
  'linear-gradient(to bottom, #fff7ed, #fed7aa)': 'Chaud (Orange)',
  'linear-gradient(to bottom, #eff6ff, #dbeafe)': 'Frais (Bleu)',
  'linear-gradient(to bottom, #f0fdf4, #dcfce7)': 'Nature (Vert)',
  'linear-gradient(to bottom, #faf5ff, #f3e8ff)': 'Lavande (Violet)',
  'linear-gradient(to bottom, #fff1f2, #fce7f3)': 'Rose',
};

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  colorOptions: string[];
  onStoryDeleted: (id: number) => void;
}

export function AdminPanel({
  open, onClose, backgroundColor, onBackgroundColorChange, colorOptions, onStoryDeleted,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'reports' | 'colors' | 'banned'>('reports');

  // ── Reports ──────────────────────────────────────────────────────────────────
  const [reportedStories, setReportedStories] = useState<ReportedStory[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');

  useEffect(() => {
    if (!open || activeTab !== 'reports') return;
    setReportsLoading(true);
    setReportsError('');
    getAdminReports()
      .then(setReportedStories)
      .catch(() => setReportsError('Impossible de charger les signalements'))
      .finally(() => setReportsLoading(false));
  }, [open, activeTab]);

  const handleBanPost = async (story: ReportedStory) => {
    if (!window.confirm(`Supprimer définitivement "${story.title}" ?`)) return;
    try {
      await deleteStory(story.id);
      setReportedStories((prev) => prev.filter((s) => s.id !== story.id));
      onStoryDeleted(story.id);
    } catch { alert('Erreur lors de la suppression'); }
  };

  const handleDismissReports = async (story: ReportedStory) => {
    if (!window.confirm('Ignorer tous les signalements pour ce post ? Il restera visible.')) return;
    try {
      await dismissReports(story.id);
      setReportedStories((prev) => prev.filter((s) => s.id !== story.id));
    } catch { alert('Erreur lors de la suppression des signalements'); }
  };

  // ── Banned words ──────────────────────────────────────────────────────────────
  const [bannedWords, setBannedWords] = useState<BannedWord[]>([]);
  const [bannedLoading, setBannedLoading] = useState(false);
  const [bannedError, setBannedError] = useState('');
  const [newWord, setNewWord] = useState('');
  const [addingWord, setAddingWord] = useState(false);

  useEffect(() => {
    if (!open || activeTab !== 'banned') return;
    setBannedLoading(true);
    setBannedError('');
    getBannedWords()
      .then(setBannedWords)
      .catch(() => setBannedError('Impossible de charger les mots bannis'))
      .finally(() => setBannedLoading(false));
  }, [open, activeTab]);

  const handleAddWord = async () => {
    const word = newWord.trim().toLowerCase();
    if (!word) return;
    setAddingWord(true);
    try {
      const added = await addBannedWord(word);
      setBannedWords((prev) => [...prev, added].sort((a, b) => a.word.localeCompare(b.word)));
      setNewWord('');
    } catch { setBannedError('Mot déjà dans la liste ou erreur serveur'); }
    finally { setAddingWord(false); }
  };

  const handleDeleteWord = async (id: number) => {
    try {
      await deleteBannedWord(id);
      setBannedWords((prev) => prev.filter((w) => w.id !== id));
    } catch { alert('Erreur lors de la suppression'); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontSize: '1.4rem', fontWeight: 700 }}>
        🛡️ Admin Panel
      </DialogTitle>

      <DialogContent>
        {/* ── Onglets ── */}
        <Box sx={{ mb: 3 }}>
          <ToggleButtonGroup value={activeTab} exclusive
            onChange={(_, v) => v && setActiveTab(v)} fullWidth size="small">
            <ToggleButton value="reports">
              <FlagIcon sx={{ mr: 0.75, fontSize: 18 }} />
              Signalements {reportedStories.length > 0 && `(${reportedStories.length})`}
            </ToggleButton>
            <ToggleButton value="banned">
              <AbcIcon sx={{ mr: 0.75, fontSize: 18 }} />
              Mots bannis {bannedWords.length > 0 && `(${bannedWords.length})`}
            </ToggleButton>
            <ToggleButton value="colors">
              <PaletteIcon sx={{ mr: 0.75, fontSize: 18 }} />
              Couleur du fond
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* ── Onglet Signalements ── */}
        {activeTab === 'reports' && (
          <Box>
            {reportsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : reportsError ? (
              <Alert severity="error">{reportsError}</Alert>
            ) : reportedStories.length === 0 ? (
              <Alert severity="success" icon={<PeopleIcon />}>
                Aucun post signalé pour le moment.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {reportedStories.map((story) => (
                  <Card key={story.id} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>{story.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            par {story.author} · {new Date(story.created_at).toLocaleDateString('fr-FR')}
                          </Typography>
                        </Box>
                        <Chip icon={<FlagIcon />}
                          label={`${story.report_count} signalement${story.report_count !== 1 ? 's' : ''}`}
                          color="error" size="small" />
                      </Box>

                      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                        {story.content.length > 200 ? story.content.substring(0, 200) + '…' : story.content}
                      </Typography>

                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Raisons signalées :</Typography>
                      {story.reports.map((report) => (
                        <Alert key={report.id} severity="warning" sx={{ mb: 1, py: 0.5 }}>
                          <Typography variant="body2">
                            <strong>{report.reported_by_username}</strong> : {report.reason}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(report.created_at).toLocaleString('fr-FR')}
                          </Typography>
                        </Alert>
                      ))}

                      <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                        <Button variant="outlined" color="success" size="small" startIcon={<CheckCircleIcon />}
                          onClick={() => handleDismissReports(story)}>
                          Ignorer
                        </Button>
                        <Button variant="contained" color="error" size="small" startIcon={<BlockIcon />}
                          onClick={() => handleBanPost(story)}>
                          Supprimer le post
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* ── Onglet Mots bannis ── */}
        {activeTab === 'banned' && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Les mots bannis sont bloqués dans les titres et contenus des histoires.
            </Typography>

            {/* Champ d'ajout */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <TextField
                label="Ajouter un mot"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
                size="small"
                fullWidth
                placeholder="ex: insulte"
                disabled={addingWord}
              />
              <Button
                variant="contained"
                onClick={handleAddWord}
                disabled={!newWord.trim() || addingWord}
                startIcon={<AddIcon />}
                sx={{ whiteSpace: 'nowrap' }}>
                Ajouter
              </Button>
            </Box>

            {bannedError && <Alert severity="error" sx={{ mb: 2 }}>{bannedError}</Alert>}

            {bannedLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : bannedWords.length === 0 ? (
              <Alert severity="info">Aucun mot banni pour le moment.</Alert>
            ) : (
              <List dense sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {bannedWords.map((w, i) => (
                  <ListItem key={w.id}
                    divider={i < bannedWords.length - 1}
                    secondaryAction={
                      <IconButton edge="end" size="small" color="error" onClick={() => handleDeleteWord(w.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }>
                    <ListItemText
                      primary={w.word}
                      primaryTypographyProps={{ fontFamily: 'monospace', fontSize: '0.95rem' }} />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}

        {/* ── Onglet Couleur du fond ── */}
        {activeTab === 'colors' && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choisir la couleur de fond pour tout le site
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {colorOptions.map((color) => (
                <Button key={color}
                  variant={backgroundColor === color ? 'contained' : 'outlined'}
                  onClick={() => onBackgroundColorChange(color)}
                  sx={{ justifyContent: 'flex-start', py: 1.5, px: 2.5, textTransform: 'none' }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: 1, background: color,
                    border: '1px solid', borderColor: 'divider', mr: 2, flexShrink: 0,
                  }} />
                  <Typography>{COLOR_LABELS[color] ?? color}</Typography>
                  {backgroundColor === color && (
                    <CheckCircleIcon sx={{ ml: 'auto', color: 'primary.contrastText' }} />
                  )}
                </Button>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

#=============================================================================
# 1. CLEAR ENVIRONMENT & INITIALIZE
#=============================================================================
rm(list = ls(all = TRUE))
if (names(dev.cur()) != "null device") graphics.off()

# Load required packages
library(dplyr)
library(ggplot2)
library(lme4)
library(lmerTest)     # Ensures Satterthwaite p-values in summaries
library(emmeans)
library(modelsummary)
library(xtable)

#=============================================================================
# 2. DATA IMPORT & PREPARATION
#=============================================================================
data <- read.csv("All data.csv", header = TRUE)

# Explicitly assign factor levels to lock in baseline references
data$label_face <- factor(data$label_face, 
                          levels = c("Attractif", "Unattractif"))

data$valence_word <- factor(data$valence_word, 
                            levels = c("negatif", "neutre", "positif"))

data$congruence <- factor(data$congruence, 
                          levels = c("congruent", "neutral", "incongruent"))
data$niveau_francais <- factor(data$niveau_francais, 
                               levels = c("Natif", "Bilingue_C2","Avance_C1","Intermediaire_B1_B2", "Debutant_A1_A2"))
#=============================================================================
# 3. DATA CLEANING & OUTLIER REMOVAL
#=============================================================================

# Step 3.1: Filter ambiguous stimuli (> 45% error rate)
taux_rejet <- data %>%
  group_by(stimulus) %>%
  summarise(reject_rate = mean(correct == 0, na.rm = TRUE), .groups = "drop")

stimuli_ambigus <- taux_rejet %>% 
  filter(reject_rate > 0.45) %>% 
  pull(stimulus)

# Step 3.2: Exclude predefined problematic subject/session IDs
id_outliers <- c("imgzntah", "jouau2am", "1v24kyhs")

# Captures all rows where language profile is NOT "Natif" and extracts unique IDs
id_non_native <- data %>%
  filter(niveau_francais %in% c("Intermediaire_B1_B2", "Debutant_A1_A2")) %>%
  pull(id) %>%
  unique()

# Combine manual outliers and non-native profiles for complete exclusion
all_excluded_ids <- c(id_outliers, id_non_native)

# Step 3.3: Filter bad trials, non-natives, and ambiguous stimuli
data_clean <- data %>%
  filter(!id %in% all_excluded_ids,
         !stimulus %in% stimuli_ambigus)

# Step 3.3: Trim extreme Reaction Times (RT) via standard Boxplot hinges
bp <- boxplot.stats(data_clean$rt)
data_clean <- data_clean %>%
  filter(rt >= bp$stats[1], rt <= bp$stats[5])

#=============================================================================
# 4. MODEL 1: FACTORIAL ANALYSIS (FACE LABEL × WORD VALENCE)
#=============================================================================
model_fact <- lmer(rt ~ label_face * valence_word + (1 | id), data = data_clean)

# Summaries and exports
summary(model_fact)
modelsummary(model_fact, output = "latex", coef_omit = "^(sd|cor)")

# ANOVA Outputs
anova_fact <- anova(model_fact, type = "III")
print(anova_fact)
xtable(anova_fact)

#=============================================================================
# 5. MODEL 2: CONGRUENCE ANALYSIS
#=============================================================================
model_cong <- lmer(rt ~ congruence + (1 | id), data = data_clean)

# Summaries and post-hoc contrasts
summary(model_cong)
emm_cong <- emmeans(model_cong, ~ congruence)
pairs(emm_cong, adjust = "tukey")
#===================================================
# Export Congruence Model to LaTeX

# Detailed summary table (Fixed effects, Random effects, and Fit metrics)
modelsummary(
  model_cong, 
  output = "latex",
  fmt = 3, # Rounds estimates to 3 decimal places
  estimate = "{estimate}{stars}", # Adds significance stars (* p<0.05, etc.)
  notes = "Note. * p < 0.05, ** p < 0.01, *** p < 0.001."
)

# Simple ANOVA-style table (If you prefer an F-test table)
anova_cong <- anova(model_cong, type = "III")
xtable(anova_cong)
#=============================================================================
# 6. DATA VISUALIZATION
#=============================================================================

# Calculate descriptive summary statistics for interaction plots
agg_data <- data_clean %>%
  group_by(valence_word, label_face) %>%
  summarise(
    mean_rt = mean(rt, na.rm = TRUE),
    sem     = sd(rt, na.rm = TRUE) / sqrt(n()),
    .groups = "drop"
  )

# ----------------------------------------------------------------------------
# Plot 1: Interaction Line Plot (X-Axis: Word Valence)
# ----------------------------------------------------------------------------
#=============================================================================
# PLOT 1 GENERATION: AGGREGATED INTERACTION WITH GRIDLINES
#=============================================================================

# Step 1: Calculate descriptive summary statistics (Means + SEM)
agg_data <- data_clean %>%
  group_by(valence_word, label_face) %>%
  summarise(
    mean_rt = mean(rt, na.rm = TRUE),
    sd_rt   = sd(rt, na.rm = TRUE),
    n       = n(),
    sem     = sd_rt / sqrt(n),
    .groups = "drop"
  )

# Step 2: Render your preferred line plot with background grids added back
ggplot(agg_data, aes(x = valence_word, y = mean_rt, group = label_face, color = label_face)) +
  geom_line(linewidth = 1.2) +
  geom_point(size = 3.5) +
  geom_errorbar(aes(ymin = mean_rt - sem, ymax = mean_rt + sem), width = 0.15, linewidth = 0.8) +
  scale_color_manual(values = c("Attractif" = "#1b9e77", "Unattractif" = "#d95f02")) +
  theme_classic(base_size = 14) +
  labs(
    title = "Reaction Times by Word Valence and Face Label",
    subtitle = "Error bars represent ±1 Standard Error of the Mean (SEM)",
    x = "Word Valence",
    y = "Mean Reaction Time (RT)",
    color = "Face Label"
  ) +
  theme(
    legend.position = "top", 
    plot.title = element_text(face = "bold"),
    # This turns back on clean horizontal and vertical panel grids
    panel.grid.major = element_line(color = "#e5e5e5", linewidth = 0.5),
    panel.grid.minor = element_line(color = "#f5f5f5", linewidth = 0.25)
  )

# Save the final image out to your folder
ggsave("factorial_interaction.png", width = 7, height = 5, dpi = 300)

#=============================================================================
# PLOT 2 BALANCED SOLUTION: ZOOMED-IN VIEW
#=============================================================================

# Step 1: Filter and calculate summaries
agg_congruence <- data_clean %>%
  filter(congruence %in% c("congruent", "incongruent")) %>%
  group_by(congruence) %>%
  summarise(
    mean_rt = mean(rt, na.rm = TRUE),
    sd_rt   = sd(rt, na.rm = TRUE),
    n       = n(),
    sem     = sd_rt / sqrt(n),
    .groups = "drop"
  )

# Step 2: Render balanced point graph with focused axis parameters
ggplot(agg_congruence, aes(x = congruence, y = mean_rt, color = congruence)) +
  # Adds a centered background track line connecting the points
  geom_linerange(aes(ymin = 0.65, ymax = mean_rt), linewidth = 4, alpha = 0.1, color = "black") +
  # Large, prominent mean markers
  geom_point(size = 5) +
  # Precise SEM flags
  geom_errorbar(aes(ymin = mean_rt - sem, ymax = mean_rt + sem), width = 0.15, linewidth = 1) +
  scale_color_manual(values = c("congruent" = "#27ae60", "incongruent" = "#8e44ad")) +
  
  # CRITICAL FIX: Zoom in on the data range to make the effect clear
  coord_cartesian(ylim = c(0.68, 0.77)) + 
  
  theme_classic(base_size = 14) +
  labs(
    title = "Reaction Times by Trial Congruence",
    subtitle = "Error bars represent ±1 Standard Error of the Mean (SEM)",
    x = "Trial Structural Match",
    y = "Mean Reaction Time (RT)"
  ) +
  theme(
    legend.position = "none",
    plot.title = element_text(face = "bold"),
    panel.grid.major = element_line(color = "#e5e5e5", linewidth = 0.5),
    panel.grid.minor = element_line(color = "#f5f5f5", linewidth = 0.25)
  )

ggsave("congruence_balanced_fixed.png", width = 5, height = 5, dpi = 300)

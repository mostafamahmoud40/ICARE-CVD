import { Module } from '@nestjs/common';

import { EMBEDDING_SERVICE } from '../../shared/ports/embedding.port';
import { AppointmentModule } from '../appointment/appointment.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PatientAiChatService } from './patient-ai-chat.service';
import { DoctorAiChatService } from './doctor-ai-chat.service';
import { ChromaService } from './chroma/chroma.service';
import { ClinicIndexerService } from './chroma/clinic-indexer.service';
import { EmbeddingService } from './embedding/embedding.service';
import { AgentRetrievalStage } from './patient-agent/agent-retrieval.stage';
import { AgentContextStage } from './patient-agent/agent-context.stage';
import { AgentPromptStage } from './patient-agent/agent-prompt.stage';
import { PatientAppointmentToolsService } from './patient-agent/langchain/patient-appointment-tools.service';
import { LangChainRagPipelineService } from './patient-agent/langchain/langchain-rag-pipeline.service';
import { LangChainCareAgentService } from './patient-agent/langchain/langchain-care-agent.service';
import { PatientMedicalContextService } from './patient-agent/patient-medical-context.service';
import { DoctorPatientContextService } from './doctor-agent/doctor-patient-context.service';
import { DoctorToolsService } from './doctor-agent/langchain/doctor-tools.service';
import { LangChainDoctorAgentService } from './doctor-agent/langchain/langchain-doctor-agent.service';
import { DoctorIndexerService } from './doctor-agent/doctor-indexer.service';
import { DoctorRetrievalStage } from './doctor-agent/doctor-retrieval.stage';
import { DoctorRagPipelineService } from './doctor-agent/langchain/doctor-rag-pipeline.service';

@Module({
  imports: [AppointmentModule],
  controllers: [AiController],
  providers: [
    AiService,
    PatientAiChatService,
    DoctorAiChatService,
    EmbeddingService,
    { provide: EMBEDDING_SERVICE, useExisting: EmbeddingService },
    ChromaService,
    ClinicIndexerService,
    AgentRetrievalStage,
    AgentContextStage,
    AgentPromptStage,
    PatientAppointmentToolsService,
    LangChainRagPipelineService,
    LangChainCareAgentService,
    PatientMedicalContextService,
    DoctorPatientContextService,
    DoctorToolsService,
    LangChainDoctorAgentService,
    DoctorIndexerService,
    DoctorRetrievalStage,
    DoctorRagPipelineService,
  ],
})
export class AiModule {}

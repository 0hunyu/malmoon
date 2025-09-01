package com.communet.malmoon.matching.repository;

import com.communet.malmoon.matching.domain.TreatmentTime;
import com.communet.malmoon.member.domain.Therapist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TreatmentTimeRepository extends JpaRepository<TreatmentTime, Long> {
    void deleteByTherapist(Therapist therapist);
}

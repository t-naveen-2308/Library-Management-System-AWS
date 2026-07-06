package com.library.repositories;

import com.library.models.Section;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SectionRepository extends CrudRepository<Section, Integer> {
    // Custom query methods can be added here
}
